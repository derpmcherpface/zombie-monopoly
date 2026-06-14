import type { BoardSpace } from "./types";

const land = (
  id: number,
  name: string,
  color: string,
  price: number,
  rent: number
): BoardSpace => ({ id, name, kind: "land", icon: "🏰", color, price, rent });

export const createBoard = (): BoardSpace[] => [
  { id: 0, name: "START", kind: "start", icon: "🌅", color: "#f4cf61" },
  land(1, "MUD HUT", "#8fcf55", 30, 10),
  { id: 2, name: "TREASURE", kind: "treasure", icon: "💰", color: "#f4cf61" },
  land(3, "BOG TOWN", "#8fcf55", 35, 12),
  { id: 4, name: "ZOMBIES", kind: "zombie", icon: "🧟", color: "#8fcf55" },
  land(5, "BONE HOUSE", "#a98af4", 40, 14),
  { id: 6, name: "SAFE CAMP", kind: "safe", icon: "⛺", color: "#57c7c4" },
  land(7, "GHOST PARK", "#a98af4", 45, 16),
  { id: 8, name: "DRAGON", kind: "dragon", icon: "🐲", color: "#f17758" },
  land(9, "FIRE FORT", "#f17758", 50, 18),
  { id: 10, name: "TREASURE", kind: "treasure", icon: "💰", color: "#f4cf61" },
  land(11, "ASH TOWER", "#f17758", 55, 20),
  { id: 12, name: "ZOMBIES", kind: "zombie", icon: "🧟", color: "#8fcf55" },
  land(13, "MOON CASTLE", "#58b9d4", 60, 22),
  { id: 14, name: "SAFE CAMP", kind: "safe", icon: "⛺", color: "#57c7c4" },
  land(15, "STAR KEEP", "#58b9d4", 65, 24)
];
