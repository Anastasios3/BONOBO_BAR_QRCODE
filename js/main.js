/**
 * Bonobo Bar & More Digital Menu
 * JavaScript entry point
 */

import { AppController } from "./controllers/AppController.js";

document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  AppController.init();
});
