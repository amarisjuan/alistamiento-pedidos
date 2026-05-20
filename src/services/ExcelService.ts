import * as ExcelJS from 'exceljs';
import type { ConsolidatedExcelItem, Item } from '../models/types';
import { BusinessLogicService } from './BusinessLogicService';

/**
 * ExcelService
 * Responsabilidad: Parsear y exportar archivos Excel
 * NO depende de React - funciones estáticas puras
 */
export class ExcelService {
  /**
   * Parsea un archivo Excel y consolida los pedidos
   */
  static async parseExcelFile(file: File): Promise<ConsolidatedExcelItem[]> {
    const buf = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buf);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('El archivo no contiene hojas válidas');
    }

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    for (let col = 1; col <= worksheet.actualColumnCount; col += 1) {
      const headerValue = headerRow.getCell(col).value;
      const textValue = this.formatCellValue(headerValue);
      headers.push(String(textValue || '').trim());
    }

    const rows: Record<string, unknown>[] = [];
    for (let rowIndex = 2; rowIndex <= worksheet.actualRowCount; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex);
      if (row.actualCellCount === 0) continue;

      const record: Record<string, unknown> = {};
      for (let col = 1; col <= headers.length; col += 1) {
        const header = headers[col - 1];
        if (!header) continue;
        record[header] = this.formatCellValue(row.getCell(col).value);
      }

      if (
        Object.values(record).some(
          (value) => value !== null && value !== undefined && value !== ''
        )
      ) {
        rows.push(record);
      }
    }

    return this.consolidate(rows);
  }

  /**
   * Consolida los datos del Excel agrupando por ciudad + referencia
   */
  private static consolidate(
    json: Record<string, unknown>[]
  ): ConsolidatedExcelItem[] {
    if (!json.length) return [];

    const sample = json[0];
    const cityCol = this.findCol(sample, ['Desc. ciudad', 'Ciudad']);
    const refCol = this.findCol(sample, ['Referencia', 'Ref']);
    const itemCol = this.findCol(sample, [
      'Item resumen',
      'Descripcion',
      'Descripción',
      'Producto',
    ]);
    const qtyCol = this.findCol(sample, [
      'Cant. pedida',
      'Cantidad pedida',
      'Cantidad',
    ]);
    const docCol = this.findCol(sample, ['Nro documento', 'Documento']);
    const umCol = this.findCol(sample, ['U.M. emp.', 'UM', 'Unidad']);
    const factorCol = this.findCol(sample, [
      'Factor U.M. emp.',
      'Factor',
      'Factor empaque',
    ]);

    if (!cityCol || !refCol || !qtyCol) {
      throw new Error(
        'Columnas requeridas no encontradas (Ciudad, Referencia, Cantidad)'
      );
    }

    const map = new Map<
      string,
      {
        ciudad: string;
        referencia: string;
        descripcion: string;
        um: string;
        factor: number;
        cantidad: number;
        pedidos: Set<string>;
      }
    >();

    for (const row of json) {
      const city = String(row[cityCol] || 'SIN CIUDAD').trim();
      const ref = String(row[refCol] || '').trim();
      if (!ref) continue;

      const item = itemCol ? String(row[itemCol] || '').trim() : '';
      const qty = Number(row[qtyCol]) || 0;
      const doc = docCol ? String(row[docCol] || '').trim() : '';
      const um = umCol ? String(row[umCol] || '').trim() : '';
      const factor = factorCol ? Number(row[factorCol]) || 1 : 1;
      const key = `${city}||${ref}`;

      if (!map.has(key)) {
        map.set(key, {
          ciudad: city,
          referencia: ref,
          descripcion: item,
          um,
          factor,
          cantidad: 0,
          pedidos: new Set(),
        });
      }

      const e = map.get(key)!;
      e.cantidad += qty;
      if (doc) e.pedidos.add(doc);
    }

    return Array.from(map.values())
      .map((e) => {
        const factor = e.factor && e.factor > 0 ? e.factor : 1;
        const isCajaCompleta = factor > 1 && e.cantidad % factor === 0;
        return {
          ciudad: e.ciudad,
          referencia: e.referencia,
          descripcion: e.descripcion,
          um: e.um,
          factor,
          cantidad: e.cantidad,
          numPedidos: e.pedidos.size,
          factorEmpaque: factor,
          umEmpaque: e.um,
          unidadAlistamiento: isCajaCompleta
            ? ('cajas' as const)
            : ('unidades' as const),
        };
      })
      .sort(
        (a, b) =>
          a.ciudad.localeCompare(b.ciudad) ||
          a.referencia.localeCompare(b.referencia)
      );
  }

  /**
   * Busca columna por candidatos
   */
  private static findCol(
    row: Record<string, unknown>,
    candidates: string[]
  ): string | null {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const f = keys.find(
        (k) => k.toLowerCase().trim() === c.toLowerCase().trim()
      );
      if (f) return f;
    }
    return null;
  }

  /**
   * Exporta el resultado del alistamiento a Excel
   */
  static exportToExcel(items: Item[], sessionId: string): void {
    if (!items.length) return;

    const workbook = new ExcelJS.Workbook();

    const general = items.map((i) => {
      const expected = BusinessLogicService.calculateExpectedUnits(i);
      const realUnits = i.cantidad_alistada !== null ? i.cantidad_alistada : '';
      const diff =
        i.cantidad_alistada !== null ? expected - i.cantidad_alistada : '';

      return {
        Ciudad: i.ciudad,
        Referencia: i.referencia,
        Descripción: i.descripcion || '',
        Tomar: `${i.cantidad_solicitada} ${
          i.unidad_alistamiento === 'cajas'
            ? i.um_empaque || 'cajas'
            : 'u.'
        }`,
        Factor: i.factor_empaque || 1,
        'Unidades Esperadas': expected,
        'Unidades Alistadas': realUnits,
        Diferencia: diff,
        Estado: i.estado,
        Motivo: i.motivo || '',
        Alistador: i.alistador || '',
        '# Pedidos': i.num_pedidos,
      };
    });

    const resultSheet = workbook.addWorksheet('Resultado');
    resultSheet.columns = [
      { header: 'Ciudad', key: 'Ciudad', width: 22 },
      { header: 'Referencia', key: 'Referencia', width: 12 },
      { header: 'Descripción', key: 'Descripción', width: 55 },
      { header: 'Tomar', key: 'Tomar', width: 14 },
      { header: 'Factor', key: 'Factor', width: 8 },
      { header: 'Unidades Esperadas', key: 'Unidades Esperadas', width: 18 },
      { header: 'Unidades Alistadas', key: 'Unidades Alistadas', width: 18 },
      { header: 'Diferencia', key: 'Diferencia', width: 12 },
      { header: 'Estado', key: 'Estado', width: 12 },
      { header: 'Motivo', key: 'Motivo', width: 16 },
      { header: 'Alistador', key: 'Alistador', width: 18 },
      { header: '# Pedidos', key: '# Pedidos', width: 10 },
    ];
    resultSheet.addRows(general);

    const cities = Array.from(new Set(items.map((i) => i.ciudad))).sort();
    for (const city of cities) {
      const rows = items
        .filter((i) => i.ciudad === city)
        .map((i) => {
          const expected = BusinessLogicService.calculateExpectedUnits(i);
          const realUnits = i.cantidad_alistada !== null ? i.cantidad_alistada : '';
          const diff =
            i.cantidad_alistada !== null ? expected - i.cantidad_alistada : '';
          return {
            Referencia: i.referencia,
            Descripción: i.descripcion || '',
            Tomar: `${i.cantidad_solicitada} ${
              i.unidad_alistamiento === 'cajas'
                ? i.um_empaque || 'cajas'
                : 'u.'
            }`,
            'Unidades Esperadas': expected,
            'Unidades Alistadas': realUnits,
            Diferencia: diff,
            Estado: i.estado,
            Motivo: i.motivo || '',
            Alistador: i.alistador || '',
          };
        });

      const sheetName = city.substring(0, 28).replace(/[\\/?*\[\]:]/g, '_');
      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.columns = [
        { header: 'Referencia', key: 'Referencia', width: 12 },
        { header: 'Descripción', key: 'Descripción', width: 55 },
        { header: 'Tomar', key: 'Tomar', width: 14 },
        { header: 'Unidades Esperadas', key: 'Unidades Esperadas', width: 18 },
        { header: 'Unidades Alistadas', key: 'Unidades Alistadas', width: 18 },
        { header: 'Diferencia', key: 'Diferencia', width: 12 },
        { header: 'Estado', key: 'Estado', width: 12 },
        { header: 'Motivo', key: 'Motivo', width: 16 },
        { header: 'Alistador', key: 'Alistador', width: 18 },
      ];
      worksheet.addRows(rows);
    }

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Alistamiento_${sessionId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  private static formatCellValue(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }

    const raw = value as Record<string, unknown>;
    if (typeof raw.text === 'string') return raw.text;
    if (Array.isArray(raw.richText)) {
      return raw.richText
        .map((fragment) =>
          typeof fragment === 'object' &&
          fragment !== null &&
          'text' in fragment
            ? String((fragment as Record<string, unknown>).text)
            : ''
        )
        .join('');
    }
    if ('result' in raw) return raw.result;

    return String(value);
  }
}

