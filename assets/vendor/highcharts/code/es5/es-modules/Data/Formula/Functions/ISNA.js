/* *
 *
 *  (c) 2009-2026 Highsoft AS
 *
 *  A commercial license may be required depending on use.
 *  See www.highcharts.com/license
 *
 *
 *  Authors:
 *  - Sophie Bremer
 *
 * */
'use strict';
import FormulaProcessor from '../FormulaProcessor.js';
var getArgumentValue = FormulaProcessor.getArgumentValue;
/* *
 *
 *  Functions
 *
 * */
/**
 * Processor for the `ISNA(value)` implementation. Returns TRUE if value is not
 * a number.
 *
 * @private
 * @function Formula.processorFunctions.ISNA
 *
 * @param {Highcharts.FormulaArguments} args
 * Arguments to process.
 *
 * @param {Highcharts.DataTable} [table]
 * Table to use for references and ranges.
 *
 * @return {boolean}
 * Result value of the process.
 */
function ISNA(args, table) {
    var value = getArgumentValue(args[0], table);
    return (typeof value !== 'number' || isNaN(value));
}
/* *
 *
 *  Registry
 *
 * */
FormulaProcessor.registerProcessorFunction('ISNA', ISNA);
/* *
 *
 *  Default Export
 *
 * */
export default ISNA;
