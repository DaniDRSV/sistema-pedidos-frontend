export const Role = Object.freeze({
  ADMIN: "ADMIN",
  CLIENT: "CLIENT",
  DELIVERY: "DELIVERY",
});

export const roleLabels = {
  [Role.ADMIN]: "Administrador",
  [Role.CLIENT]: "Cliente",
  [Role.DELIVERY]: "Repartidor",
};

export const roleStyles = {
  [Role.ADMIN]: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  [Role.CLIENT]: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  [Role.DELIVERY]: "border-amber-400/30 bg-amber-500/10 text-amber-300",
};

export const vehicleLabels = {
  MOTORCYCLE: "Motocicleta",
  CAR: "Automóvil",
  BICYCLE: "Bicicleta",
};

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
