import type { Dataset } from "@/lib/model";
import { buildModel } from "@/lib/model";
import { guestNotes } from "./guest-notes";
import { guests } from "./guests";
import { locks } from "./locks";
import { properties } from "./properties";
import { reservations } from "./reservations";
import { rooms } from "./rooms";
import { accessTasks } from "./tasks";

/** The starting data for the prototype. The app copies this into React state, so edits never touch these arrays. */
export const seed: Dataset = {
  properties,
  rooms,
  guests,
  reservations,
  locks,
  tasks: accessTasks,
  notes: guestNotes,
  messages: [],
  activity: [],
};

export const seedModel = buildModel(seed);
