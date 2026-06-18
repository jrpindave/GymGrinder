# GymGrinder

App de seguimiento de gimnasio: calendario 3D de cubos por día, registro de ejercicios (con biseries, PRs, filtros), fotos de progreso, rutinas, gráficos de progresión y un sistema de recompensa tipo meta de ahorro.

**En vivo:** https://jrpindave.github.io/GymGrinder/

## Stack

- **Next.js 16** (App Router) con **export estático** (`output: 'export'`)
- **TypeScript** strict + **Tailwind v4**
- **Zustand** para estado global (`store/appStore.ts`)
- **@supabase/supabase-js** para datos
- **React Three Fiber** (`@react-three/fiber` + `@react-three/drei` + `three`) para el calendario 3D

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar con la URL y anon key de Supabase
npm run dev                  # http://localhost:3000
npm run build                # export estático → out/
npm run lint
```

## Dónde vive todo

| Componente | Ubicación actual |
|---|---|
| Código fuente | local `C:\Users\jirp_\gymgrinder-next` + GitHub |
| Repo / rama | `jrpindave/GymGrinder`, rama **`next-rewrite`** (el HTML viejo está en `main`) |
| Base de datos + storage | Supabase proyecto personal `wetwdokwnstjidoceoib` (bucket `gym-photos`) |
| Hosting | GitHub Pages (build por GitHub Actions) |
| Variables de entorno | `NEXT_PUBLIC_SUPA_URL`, `NEXT_PUBLIC_SUPA_KEY` (repo *variables* + `.env.local`) |

El deploy es automático: cada push a `next-rewrite` dispara `.github/workflows/deploy.yml`, que hace
`npm run build` y publica `out/` en Pages.

## Estructura

Ver `CLAUDE.md` para el detalle de carpetas, convenciones y la lista de funciones RPC de Supabase.

## Migración de cuenta

> ⚠️ **Nota del dueño:** este proyecto fue declarado *personal* y se pidió explícitamente que **no**
> quedara bajo las cuentas de la organización **Constructora Garcia** (ni Supabase ni Vercel). Antes de
> mover nada a una cuenta corporativa, confirmar **a qué organización** y **qué piezas** se migran.

Para migrar el proyecto a otra cuenta/organización hay **cuatro piezas independientes**, cada una se puede
mover por separado:

1. **Repositorio GitHub** — transferir `jrpindave/GymGrinder` a la org destino (Settings → Transfer
   ownership) o crear un repo nuevo en la org y re-pushear. Implica actualizar el remoto local y las URLs.

2. **Supabase** — el proyecto `wetwdokwnstjidoceoib` (tablas `gym_*`, funciones RPC, bucket `gym-photos`,
   datos históricos). Migrar = transferir el proyecto a otra organización Supabase **o** crear uno nuevo y
   migrar schema + datos + storage. Si cambia el proyecto, actualizar las 2 env vars.

3. **Hosting** — hoy es GitHub Pages (atado al repo). Si el repo se transfiere, la URL pasa a
   `https://<org>.github.io/GymGrinder/` y hay que reconfigurar Pages + el branch policy del entorno
   `github-pages`. Si en cambio se va a Vercel, importar el repo en el team destino y setear las env vars.

4. **Variables de entorno** — `NEXT_PUBLIC_SUPA_URL` / `NEXT_PUBLIC_SUPA_KEY` deben recrearse en el destino
   (repo variables de GitHub o env vars de Vercel). La anon key es pública (la protege RLS).

**Orden recomendado:** Supabase primero (si cambia) → actualizar env vars → transferir/crear repo →
reconfigurar hosting → verificar el deploy en vivo.
