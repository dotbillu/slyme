import { CookieOptions } from "express";

// export const cookieOptions: CookieOptions = {
//   httpOnly: true,
//   secure: false,
//   sameSite: "lax",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// };
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  domain: ".dotbillu.in",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
