import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { config } from "dotenv";

config();

if (process.env.OTEL_LOG_LEVEL === "debug") {
	diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const sdk = new NodeSDK({
	serviceName: process.env.OTEL_SERVICE_NAME || "backend_service",
	instrumentations: [getNodeAutoInstrumentations()],
});

try {
	await sdk.start();
	globalThis.sdk = sdk;
	console.log("OpenTelemetry initialized");
} catch (error) {
	console.error("OpenTelemetry initialization failed:", error);
}
