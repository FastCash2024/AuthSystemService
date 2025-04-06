import Redis from "ioredis";

// Cliente principal para sesiones
export const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
});

// Cliente para publicar eventos en Redis
export const pub = new Redis({
    host: "127.0.0.1",
    port: 6379,
});

// Cliente para suscribirse a eventos (se usará en WebSockets)
export const sub = new Redis({
    host: "127.0.0.1",
    port: 6379,
});

redis.on("connect", () => console.log("✅ Conectado a Redis (Sesiones)"));
redis.on("error", (err) => console.error("❌ Error en Redis (Sesiones):", err));

pub.on("connect", () => console.log("✅ Conectado a Redis (Publicador)"));
pub.on("error", (err) => console.error("❌ Error en Redis (Publicador):", err));

sub.on("connect", () => console.log("✅ Conectado a Redis (Suscriptor)"));
sub.on("error", (err) => console.error("❌ Error en Redis (Suscriptor):", err));
