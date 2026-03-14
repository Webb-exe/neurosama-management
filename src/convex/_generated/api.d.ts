/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_clerk from "../auth/clerk.js";
import type * as auth_helpers from "../auth/helpers.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_invites from "../auth/invites.js";
import type * as auth_users from "../auth/users.js";
import type * as calender_FirstEvents from "../calender/FirstEvents.js";
import type * as calender_main from "../calender/main.js";
import type * as crons from "../crons.js";
import type * as functions from "../functions.js";
import type * as integrations_ftcCalendarSync from "../integrations/ftcCalendarSync.js";
import type * as integrations_http from "../integrations/http.js";
import type * as integrations_index from "../integrations/index.js";
import type * as scouting_cycles from "../scouting/cycles.js";
import type * as scouting_forms from "../scouting/forms.js";
import type * as scouting_index from "../scouting/index.js";
import type * as scouting_lib from "../scouting/lib.js";
import type * as scouting_sessions from "../scouting/sessions.js";
import type * as scouting_tags from "../scouting/tags.js";
import type * as scouting_teams from "../scouting/teams.js";
import type * as settings_index from "../settings/index.js";
import type * as settings_settings from "../settings/settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/clerk": typeof auth_clerk;
  "auth/helpers": typeof auth_helpers;
  "auth/index": typeof auth_index;
  "auth/invites": typeof auth_invites;
  "auth/users": typeof auth_users;
  "calender/FirstEvents": typeof calender_FirstEvents;
  "calender/main": typeof calender_main;
  crons: typeof crons;
  functions: typeof functions;
  "integrations/ftcCalendarSync": typeof integrations_ftcCalendarSync;
  "integrations/http": typeof integrations_http;
  "integrations/index": typeof integrations_index;
  "scouting/cycles": typeof scouting_cycles;
  "scouting/forms": typeof scouting_forms;
  "scouting/index": typeof scouting_index;
  "scouting/lib": typeof scouting_lib;
  "scouting/sessions": typeof scouting_sessions;
  "scouting/tags": typeof scouting_tags;
  "scouting/teams": typeof scouting_teams;
  "settings/index": typeof settings_index;
  "settings/settings": typeof settings_settings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
