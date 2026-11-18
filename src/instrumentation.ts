export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkStartup } = await import("./lib/startup");
  checkStartup();
}
