"use client";

import { createContext, useContext } from "react";

/** Shell-level actions that page headers need now that there is no global top bar. */
export type ShellControls = { openSearch: () => void; openNav: () => void };

const ShellContext = createContext<ShellControls>({ openSearch: () => {}, openNav: () => {} });

export const ShellProvider = ShellContext.Provider;
export const useShell = () => useContext(ShellContext);
