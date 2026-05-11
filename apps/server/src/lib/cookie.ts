import { CookieOptions } from "express";

const isdev = process.env.IS_TEST === "true";

const devcookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const prodcookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  domain: ".dotbillu.in",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const cookieOptions: CookieOptions = isdev
  ? devcookieOptions
  : prodcookieOptions;
