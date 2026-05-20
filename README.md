# 📦 Alistamiento de Pedidos - Dislicores

Sistema React + TypeScript + Supabase para gestión de alistamiento (picking) de pedidos en bodega.

## 🏗️ Arquitectura

Aplicación con **Arquitectura Limpia**, separando lógica de negocio de presentación.

```
src/
├── models/          # Tipos TypeScript
├── services/        # Lógica de negocio (NO UI)
│   ├── BusinessLogicService.ts    # Reglas de negocio
│   ├── ExcelService.ts            # Manejo de Excel
│   ├── SupabaseService.ts         # Operaciones DB
│   └── ShareService.ts            # Compartir
├── context/         # Estado global
│   └── AppContext.tsx
├── components/      # Componentes presentacionales
│   ├── WelcomeScreen.tsx
│   ├── SupervisorHomeScreen.tsx
│   ├── SupervisorDashboard.tsx
│   ├── AlistadorJoinScreen.tsx
│   ├── CityListScreen.tsx
│   ├── PickListScreen.tsx
│   ├── ItemDetailModal.tsx
│   ├── SummaryScreen.tsx
│   ├── Header.tsx
│   ├── Toast.tsx
│   └── Loader.tsx
├── lib/
│   └── supabase.ts  # Cliente Supabase
├── styles/
│   └── global.css
└── App.tsx          # Controlador principal
```

## 🚀 Instalación

```bash
npm install
npm run dev
```

## 🌐 Deploy en Netlify

1. Conectar este repo en Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`

## 🎯 Funcionalidades

### Supervisor 👔
- Cargar Excel de pedidos
- Crear sesión en la nube
- Monitorear avance en tiempo real
- Ver estadísticas por ciudad
- Descargar Excel final
- Compartir resumen (WhatsApp/Email)

### Alistador 👷
- Ingresar con su nombre
- Seleccionar sesión activa
- Ver lista por ciudad
- Picking de productos
- Marcar: Completo / Parcial / Sin stock
- Registrar motivos
- Sincronización en tiempo real

## 🛠️ Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Supabase** (DB + Realtime)
- **XLSX** (procesamiento Excel)

## 📝 Reglas de Oro

1. **Componentes**: Solo renderizado, props, y callbacks
2. **Servicios**: Lógica de negocio pura, sin JSX
3. **Context**: Estado global compartido
4. **Tipos**: Interfaces explícitas para todo
5. **Sin `any`**: TypeScript estricto
