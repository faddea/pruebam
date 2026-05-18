# Especificación de Requisitos (Spec Driven Development) - Gestor de Gastos y Vencimientos

Esta aplicación está diseñada para ser utilizada en dispositivos Android (empaquetada como APK usando **codeleitor**) y conectada a un servidor backend en **FastAPI** desplegado en **Railway**.

Dado que es de uso personal y local, **no requiere sistema de login / autenticación**.

---

## 💾 Modelo de Datos (Base de Datos - SQLite / PostgreSQL)

Diseñaremos tres tablas principales para gestionar las cuentas, los gastos diarios y los pagos programados/vencimientos.

### 1. Cuentas (`cuentas`)
Representa los bancos, billeteras virtuales o efectivo del usuario.
*   `id`: INTEGER (Primary Key, Auto-increment)
*   `nombre`: VARCHAR (Ej: "Mercado Pago", "Banco Galicia", "Efectivo") - *Único*
*   `saldo`: DECIMAL (Saldo actual disponible en la cuenta)
*   `color`: VARCHAR (Código hexadecimal para identificar la cuenta visualmente en la UI, ej: `#009EE3`)

### 2. Gastos (`gastos`)
Historial de transacciones de salida.
*   `id`: INTEGER (Primary Key, Auto-increment)
*   `cuenta_id`: INTEGER (Foreign Key a `cuentas.id`)
*   `monto`: DECIMAL (Valor del gasto)
*   `descripcion`: TEXT (Detalle del gasto, ej: "Comida en supermercado")
*   `fecha`: DATETIME (Fecha y hora en que se realizó el gasto)
*   `categoria`: VARCHAR (Ej: "Alimentos", "Transporte", "Entretenimiento", "Servicios")

### 3. Pagos Pendientes (`pagos_pendientes`)
Control de agenda y vencimientos (impuestos, servicios, etc.).
*   `id`: INTEGER (Primary Key, Auto-increment)
*   `nombre`: VARCHAR (Ej: "Internet", "Luz", "Cable de Mamá")
*   `monto`: DECIMAL (Monto estimado o exacto a pagar)
*   `fecha_vencimiento`: DATE (Fecha límite de pago)
*   `pagado`: BOOLEAN (Default: `false`)
*   `fecha_pago`: DATETIME (Opcional, fecha en que se marcó como pagado)
*   `cuenta_id`: INTEGER (Foreign Key a `cuentas.id`, opcional, indica con qué cuenta se pagó una vez completado)

---

## 🔌 API Endpoints (FastAPI Backend)

El backend expondrá una API REST bajo el prefijo `/api`.

### Cuentas
*   `GET /api/cuentas` -> Retorna la lista de todas las cuentas y sus saldos.
*   `POST /api/cuentas` -> Crea una nueva cuenta.
*   `PUT /api/cuentas/{id}` -> Modifica el nombre, saldo inicial o color de una cuenta.
*   `DELETE /api/cuentas/{id}` -> Elimina una cuenta (opcionalmente advierte si tiene gastos asociados).

### Gastos
*   `GET /api/gastos` -> Retorna el listado de gastos (con soporte para filtrar por `mes`, `año` o `cuenta_id`).
*   `POST /api/gastos` -> Registra un gasto. **Importante:** Resta automáticamente el `monto` del `saldo` de la cuenta asociada.
*   `DELETE /api/gastos/{id}` -> Elimina un gasto y **devuelve/suma** el monto al saldo de la cuenta asociada.

### Pagos Pendientes / Vencimientos
*   `GET /api/pagos` -> Retorna la lista de pagos pendientes y/o realizados (filtrados por estado de pago o mes).
*   `POST /api/pagos` -> Crea un nuevo pago pendiente en la agenda.
*   `POST /api/pagos/{id}/pagar` -> Marca un pago como realizado.
    *   **Lógica:** Recibe el `cuenta_id` con el que se pagó. Actualiza el estado a `pagado = true`, registra la `fecha_pago` y **crea automáticamente un registro en la tabla `gastos`** (con la categoría "Servicios" o similar) descontando el saldo de la cuenta correspondiente.
*   `PUT /api/pagos/{id}` -> Edita detalles de un pago pendiente.
*   `DELETE /api/pagos/{id}` -> Elimina un pago de la agenda.

---

## 🎨 Interfaz de Usuario (Frontend SPA)

El frontend se construirá como una **Single Page Application (SPA)** usando HTML, Tailwind CSS y JavaScript vainilla. Tendrá un diseño moderno, oscuro (dark mode premium) y optimizado para pantallas táctiles.

### Secciones Principales:
1.  **Dashboard (Inicio):**
    *   Resumen del saldo total (suma de todas las cuentas).
    *   Carrusel o tarjetas visuales de las **Cuentas** con sus saldos y colores identificadores.
    *   Indicador rápido de **Vencimientos para Hoy / Próximos días** (con alertas en rojo/amarillo).
2.  **Agenda de Pagos:**
    *   Calendario o lista ordenada por fecha de vencimiento.
    *   Botón para "Marcar como Pagado" que abre un modal para seleccionar con qué cuenta se realiza el pago.
    *   Filtro para ver "Pendientes" vs "Pagados".
3.  **Registro de Gastos:**
    *   Formulario rápido para ingresar: Monto, Descripción, Cuenta (dropdown), Categoría y Fecha.
    *   Historial de los últimos gastos realizados.
4.  **Resumen Mensual:**
    *   Gráfico simple (o barras visuales CSS) de gastos agrupados por categoría en el mes actual.
    *   Navegación para ver meses anteriores.

### 📱 Integración con Mercado Pago:
*   Un botón destacado en la app que dice **"Ir a Mercado Pago"** o **"Realizar Transferencia"**.
*   **Implementación:** Utilizaremos un enlace universal o esquema URI que en dispositivos Android abre directamente la aplicación de Mercado Pago si está instalada, o redirige a la web en su defecto:
    *   Enlace: `https://www.mercadopago.com.ar/` (Android maneja este enlace abriendo la app automáticamente mediante App Links).
    *   Opcional: Esquema custom `intent://` si fuese necesario forzar la apertura de la app.

---

## ⚙️ Configuración y Empaquetado APK

*   **Rutas Relativas:** Todos los assets del frontend (`index.html`, `main.js`, estilos CSS) deben usar rutas relativas para que funcionen correctamente al cargarse localmente desde el sistema de archivos del celular a través del WebView de `codeleitor`.
*   **URL del Backend:** En `main.js` definiremos una constante configurable para la URL de la API (ej: `const API_URL = "https://tu-backend.railway.app/api"`), de modo que la APK instalada en el celular consuma la API remota de Railway sin problemas de CORS.
