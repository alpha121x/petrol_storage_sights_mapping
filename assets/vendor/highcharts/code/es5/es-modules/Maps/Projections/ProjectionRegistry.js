/* *
 *
 *  Projection registry
 *
 *  (c) 2021-2026 Highsoft AS
 *
 *  A commercial license may be required depending on use.
 *  See www.highcharts.com/license
 *
 *  Authors:
 *  - Torstein Honsi
 *
 * */
'use strict';
/* *
 *
 *  Imports
 *
 * */
import LambertConformalConic from './LambertConformalConic.js';
import EqualEarth from './EqualEarth.js';
import Miller from './Miller.js';
import Orthographic from './Orthographic.js';
import WebMercator from './WebMercator.js';
/* *
 *
 *  Constants
 *
 * */
var projectionRegistry = {
    EqualEarth: EqualEarth,
    LambertConformalConic: LambertConformalConic,
    Miller: Miller,
    Orthographic: Orthographic,
    WebMercator: WebMercator
};
/* *
 *
 *  Default Export
 *
 * */
export default projectionRegistry;
