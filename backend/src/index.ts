import { app } from "./app";

const port = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

app.listen(port, () => {
  if (isProd) {
    const backendUrl  = process.env.BACKEND_URL  ?? `http://localhost:${port}`;
    const frontendUrl = process.env.FRONTEND_URL ?? "(no configurado)";
    console.log(`[ScoutPanel] API lista — entorno: production`);
    console.log(`[ScoutPanel] Backend:  ${backendUrl}`);
    console.log(`[ScoutPanel] Frontend: ${frontendUrl}`);
    console.log(`[ScoutPanel] CORS origins: ${process.env.ALLOWED_ORIGINS ?? "localhost:3000"}`);
  } else {
    console.log(`[ScoutPanel] API lista en http://localhost:${port} (development)`);
  }
});
