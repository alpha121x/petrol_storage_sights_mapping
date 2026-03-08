/*! Datatables altEditor 1.0
*/
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'datatables.net'], function ($) {
            return factory($, window, document);
        });
    } else if (typeof exports === 'object') {
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                $ = require('datatables.net')(root, $).$;
            }
            return factory($, root, root.document);
        };
    } else {
        factory(jQuery, window, document);
    }
}(function ($, window, document, undefined) {
    'use strict';
    var DataTable = $.fn.dataTable;
    var _instance = 0;
    var altEditor = function (dt, opts) {
        if (!DataTable.versionCheck || !DataTable.versionCheck('1.10.8')) {
            throw("Warning: altEditor requires DataTables 1.10.8 or greater");
        }
        this.c = $.extend(true, {}, DataTable.defaults.altEditor, altEditor.defaults, opts);
        this.s = {dt: new DataTable.Api(dt), namespace: '.altEditor' + (_instance++)};
        this.dom = {modal: $('<div class="dt-altEditor-handle"/>'),};
        this._constructor();
    }
    $.extend(altEditor.prototype, {
        _constructor: function () {
            var that = this;
            var dt = this.s.dt;
            this._setup();
            dt.on('destroy.altEditor', function () {
                dt.off('.altEditor');
                $(dt.table().body()).off(that.s.namespace);
                $(document.body).off(that.s.namespace);
            });
        }, _setup: function () {
            var that = this;
            var dt = this.s.dt;
            $('main').append('\
            <div class="modal fade" id="altEditor-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">\
              <div class="modal-dialog modal-lg">\
                <div class="modal-content" style="border-radius: 5px;">\
                  <div class="modal-header py-2 px-3" style="background-color: #0594B7; color: #fff; border-top-left-radius:5px; border-top-right-radius: 5px; ">\
                    <h5 class="modal-title" id="exampleModalLabel"></h5>\
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="color: #fff !important;"></button>\
                  </div>\
                  <div class="modal-body">\
                    <p></p>\
                  </div>\
                  <div class="modal-footer">\
                    <button type="button" class="btn btn-default" data-bs-dismiss="modal">Close</button>\
                    <button type="button" class="btn btn-primary">Save changes</button>\
                  </div>\
                </div>\
              </div>\
            </div>');
            if (this.s.dt.button('edit:name')) {
                this.s.dt.button('edit:name').action(function (e, dt, node, config) {
                    var rows = dt.rows({selected: true}).count();
                    that._openEditModal();
                });

                $(document).on('click', '#editRowBtn', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that._editRowData();
                });
            }
            if (this.s.dt.button('delete:name')) {
                this.s.dt.button('delete:name').action(function (e, dt, node, config) {
                    var rows = dt.rows({selected: true}).count();
                    that._openDeleteModal();
                });
                $(document).on('click', '#deleteRowBtn', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that._deleteRow();
                });
            }
            if (this.s.dt.button('add:name')) {
                this.s.dt.button('add:name').action(function (e, dt, node, config) {
                    var rows = dt.rows({selected: true}).count();
                    that._openAddModal();
                });
                $(document).on('click', '#addRowBtn', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that._addRowData();
                });
            }
        }, _emitEvent: function (name, args) {
            this.s.dt.iterator('table', function (ctx, i) {
                $(ctx.nTable).triggerHandler(name + '.dt', args);
            });
        }, _openEditModal: function () {
            var that = this;
            var dt = this.s.dt;
            var columnDefs = [];
            for (var i = 0; i < dt.context[0].aoColumns.length; i++) {
                columnDefs.push({title: dt.context[0].aoColumns[i].sTitle})
            }
            var adata = dt.rows({selected: true});
            var data = "";
            data += "<form name='altEditor-form' id='altEditorForm' role='form'>";

            for (var j in columnDefs) {
                console.log(columnDefs[j]);
                data += "<div class='row'>";
                data += "<div class='col-sm-5 col-md-5 col-lg-5 text-end' style='padding-top:5px;padding-bottom:5px;'>";
                data += "<label for='" + columnDefs[j].title + "'>" + columnDefs[j].title + ":</label>";
                data += "</div>";
                data += "<div class='col-sm-7 col-md-7 col-lg-7 mb-1'>";

                if (columnDefs[j].title == 'raw_id') {
                    data += "<input type='text' disabled='disabled'  id='" + columnDefs[j].title + "' name='" + columnDefs[j].title + "' placeholder='" + columnDefs[j].title + "' style='overflow:hidden'  class='form-control  form-control-sm' value='" + adata.data()[0][j] + "'>";
                }
                    // else if (columnDefs[j].title == 'operational_status') {
                    //     //data += "<input type='time'  id='"+columnDefs[j].title+"' name='"+columnDefs[j].title+"' placeholder='"+columnDefs[j].title+"' style='overflow:hidden'  class='form-control  form-control-sm' value='"+adata.data()[0][j]+"'>";
                    //     data += "<select class='form-select form-select-sm' style='width: 100%;'>";
                    //     data += "<option value='Functional'>Functional</option>";
                    //     data += "<option value='Non - Functional'>Non - functional</option>";
                    //     data += "<option value='Abandoned'>Abandoned</option>";
                    //     data += "<option value='Under Construction'>Under Construction</option>";
                    //     data += "</select>";
                // }
                else {
                    data += "<input type='text' required id='" + columnDefs[j].title + "' name='" + columnDefs[j].title + "' placeholder='" + columnDefs[j].title + "' style='overflow:hidden'  class='form-control  form-control-sm' value='" + adata.data()[0][j] + "'>";
                }

                data += "</div>";
                data += "<div style='clear:both;'>";
                data += "</div>";
                data += "</div>";

            }

            data += "</form>";

            $('#altEditor-modal').on('show.bs.modal', function () {
                $('#altEditor-modal').find('.modal-title').html('Edit Record');
                $('#altEditor-modal').find('.modal-body').html('<pre>' + data + '</pre>');
                $('#altEditor-modal').find('.modal-footer').html("<button type='button' data-content='remove' class='btn btn-default' data-bs-dismiss='modal'>Close</button><button type='button' data-content='remove' class='btn btn-primary' id='editRowBtn'>Save Changes</button>");
            });

            $('#altEditor-modal').modal('show');
            //$('#altEditor-modal input[1]').focus();

        }, _editRowData: function () {
            var that = this;
            var dt = this.s.dt;

            var data = [];

            $('form[name="altEditor-form"] input').each(function (i) {

                data.push($(this).val());
                console.log(data);
            });

            $('#altEditor-modal .modal-body .alert').remove();
            // var message='<div class="alert alert-success" role="alert">\
            //      <strong>Success!</strong> This record has been updated.\
            //    </div>';$('#altEditor-modal .modal-body').append(message);
            dt.row({selected: true}).data(data);
        }, _openDeleteModal: function () {
            var that = this;
            var dt = this.s.dt;
            var columnDefs = [];
            for (var i = 0; i < dt.context[0].aoColumns.length; i++) {
                columnDefs.push({title: dt.context[0].aoColumns[i].sTitle})
            }
            var adata = dt.rows({selected: true});
            var data = "";
            data += "<form name='altEditor-form' role='form'>";
            for (var i in columnDefs) {
                data += "<div class='form-group'><label for='" + columnDefs[i].title + "'>" + columnDefs[i].title + " : </label><input  type='hidden'  id='" + columnDefs[i].title + "' name='" + columnDefs[i].title + "' placeholder='" + columnDefs[i].title + "' style='overflow:hidden'  class='form-control' value='" + adata.data()[0][i] + "' >" + adata.data()[0][i] + "</input></div>";
            }
            data += "</form>";
            $('#altEditor-modal').on('show.bs.modal', function () {
                $('#altEditor-modal').find('.modal-title').html('Delete Record');
                $('#altEditor-modal').find('.modal-body').html('<pre>' + data + '</pre>');
                $('#altEditor-modal').find('.modal-footer').html("<button type='button' data-content='remove' class='btn btn-default' data-bs-dismiss='modal'>Close</button>\
               <button type='button' data-content='remove' class='btn btn-danger' id='deleteRowBtn'>Delete</button>");
            });
            $('#altEditor-modal').modal('show');
            $('#altEditor-modal input[0]').focus();
        }, _deleteRow: function () {
            var that = this;
            var dt = this.s.dt;
            $('#altEditor-modal .modal-body .alert').remove();
            var message = '<div class="alert alert-success" role="alert">\
           <strong>Success!</strong> This record has been deleted.\
         </div>';
            $('#altEditor-modal .modal-body').append(message);
            dt.row({selected: true}).remove();
            dt.draw();
        }, _openAddModal: function () {
            var that = this;
            var dt = this.s.dt;
            var columnDefs = [];
            for (var i = 0; i < dt.context[0].aoColumns.length; i++) {
                columnDefs.push({title: dt.context[0].aoColumns[i].sTitle})
            }
            var data = "";
            data += "<form name='altEditor-form' role='form'>";
            for (var j in columnDefs) {
                data += "<div class='form-group'><div class='col-sm-3 col-md-3 col-lg-3 text-right' style='padding-top:7px;'><label for='" + columnDefs[j].title + "'>" + columnDefs[j].title + ":</label></div><div class='col-sm-9 col-md-9 col-lg-9'><input type='text'  id='" + columnDefs[j].title + "' name='" + columnDefs[j].title + "' placeholder='" + columnDefs[j].title + "' style='overflow:hidden'  class='form-control  form-control-sm' value=''></div><div style='clear:both;'></div></div>";
            }
            data += "</form>";
            $('#altEditor-modal').on('show.bs.modal', function () {
                $('#altEditor-modal').find('.modal-title').html('Add Record');
                $('#altEditor-modal').find('.modal-body').html('<pre>' + data + '</pre>');
                $('#altEditor-modal').find('.modal-footer').html("<button type='button' data-content='remove' class='btn btn-default' data-bs-dismiss='modal'>Close</button>\
               <button type='button' data-content='remove' class='btn btn-primary' id='addRowBtn'>Add Record</button>");
            });
            $('#altEditor-modal').modal('show');
            $('#altEditor-modal input[0]').focus();
        }, _addRowData: function () {
            console.log('add row')
            var that = this;
            var dt = this.s.dt;
            var data = [];
            $('form[name="altEditor-form"] input').each(function (i) {
                data.push($(this).val());
            });
            $('#altEditor-modal .modal-body .alert').remove();
            var message = '<div class="alert alert-success" role="alert">\
           <strong>Success!</strong> This record has been added.\
         </div>';
            $('#altEditor-modal .modal-body').append(message);
            dt.row.add(data).draw(false);
        }, _getExecutionLocationFolder: function () {
            var fileName = "dataTables.altEditor.js";
            var scriptList = $("script[src]");
            var jsFileObject = $.grep(scriptList, function (el) {
                if (el.src.indexOf(fileName) !== -1) {
                    return el;
                }
            });
            var jsFilePath = jsFileObject[0].src;
            var jsFileDirectory = jsFilePath.substring(0, jsFilePath.lastIndexOf("/") + 1);
            return jsFileDirectory;
        }
    });
    altEditor.version = '1.0';
    altEditor.defaults = {alwaysAsk: false, focus: null, columns: '', update: null, editor: null};
    altEditor.classes = {btn: 'btn'};
    $(document).on('preInit.dt.altEditor', function (e, settings, json) {
        if (e.namespace !== 'dt') {
            return;
        }
        var init = settings.oInit.altEditor;
        var defaults = DataTable.defaults.altEditor;
        if (init || defaults) {
            var opts = $.extend({}, init, defaults);
            if (init !== false) {
                new altEditor(settings, opts);
            }
        }
    });
    DataTable.altEditor = altEditor;
    return altEditor;
}));