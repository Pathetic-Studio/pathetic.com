// components/header/nav-anim-registry.ts
"use client";

export type NavSlotController = {
  open: () => Promise<void>;
  close: () => Promise<void>;
  setOpenImmediate: (open: boolean) => void;
};

let socialCtrl: NavSlotController | null = null;
let leftCtrl: NavSlotController | null = null;
let rightCtrl: NavSlotController | null = null;
let mobileNavCtrl: NavSlotController | null = null;
let mobileSocialCtrl: NavSlotController | null = null;

export function registerSocialNavController(ctrl: NavSlotController | null) {
  socialCtrl = ctrl;
}
export function registerLeftNavController(ctrl: NavSlotController | null) {
  leftCtrl = ctrl;
}
export function registerRightNavController(ctrl: NavSlotController | null) {
  rightCtrl = ctrl;
}
export function registerMobileNavController(ctrl: NavSlotController | null) {
  mobileNavCtrl = ctrl;
}
export function registerMobileSocialNavController(ctrl: NavSlotController | null) {
  mobileSocialCtrl = ctrl;
}

export function getSocialNavController(): NavSlotController | null {
  return socialCtrl;
}
export function getLeftNavController(): NavSlotController | null {
  return leftCtrl;
}
export function getRightNavController(): NavSlotController | null {
  return rightCtrl;
}
export function getMobileNavController(): NavSlotController | null {
  return mobileNavCtrl;
}
export function getMobileSocialNavController(): NavSlotController | null {
  return mobileSocialCtrl;
}
