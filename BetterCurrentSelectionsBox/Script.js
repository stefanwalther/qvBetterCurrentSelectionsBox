
// Global PlaceHolder for holding the state of current selections.
// Must be set global because if there are not changes we will - on update - not get 
// any results from GetCurrentSelections()
var gBCSB_Selections = {};

function BetterCurrentSelectionsBox_Init() {

    Qva.AddExtension("BetterCurrentSelectionsBox",
        function () {

            var _this = this;
            _this.ExtSettings = {};
            _this.ExtSettings.OpenedStandardSelections = false;
            _this.ExtSettings.ExtensionName = 'BetterCurrentSelectionsBox';
            _this.ExtSelections = {};

            // On Update Complete: Just set the icon visibility ...
            Qv.GetCurrentDocument().SetOnUpdateComplete(function () {
                ConsoleInfo("On Update Complete");
                SetIconVisibility();
            });

            
            // Load the desired css files
            var cssFiles = [];
            cssFiles.push('Extensions/' + _this.ExtSettings.ExtensionName + '/lib/css/BetterCurrentSelectionsBox.css');
            cssFiles.push('Extensions/' + _this.ExtSettings.ExtensionName + '/lib/css/jquery.resizableColumns.css');
            for (var i = 0; i < cssFiles.length; i++) {
                Qva.LoadCSS(Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=' + cssFiles[i]);
            }

            // Load the required JavaScript files
            var jsFiles = [];
            jsFiles.push('Extensions/' + _this.ExtSettings.ExtensionName + '/lib/js/jquery.swr.js');
            jsFiles.push('Extensions/' + _this.ExtSettings.ExtensionName + '/lib/js/jquery.resizableColumns.min.js');
            Qv.LoadExtensionScripts(jsFiles, function () {

                ConsoleInfo("Main Extension Code ...");
                SupportSelectBox();
                InitSettings();                 // fetch settings
                getData();                      // retrieve data
                renderSelectionBox();           // render the selectionbox body
                renderSelectionBoxContent();    // render the selectionbox content
                UpdateSelections();

                ConsoleInfo("Finished ...");
            });



            // Layouting
            function SetIconVisibility() {
                ConsoleInfo("Set Icon Visibility");

                // Hide all rows
                //$(".BCSB_Row").hide();

                if (gBCSB_Selections != undefined && gBCSB_Selections.Rows != undefined) {
                    for (i = 0; i < gBCSB_Selections.Rows.length; i++) {
                        var fieldName = gBCSB_Selections.Rows[i][0].text;
                        var isFieldLocked = gBCSB_Selections.Rows[i][0].locked;
                        ConsoleLog("\tField <" + fieldName + "> is locked: " + isFieldLocked);

                        if ($(".BCSB_Row[fieldName='" + fieldName + "']").length > 0) {

                            // Show the row
                            //$(".BCSB_Row[fieldName='" + fieldName + "']").show();

                            var $imgStatus = $(".BCSB_Row[fieldName='" + fieldName + "'] .BCSB_imgStatus");
                            var imgBasePath = $imgStatus.attr("src").substr(0, $imgStatus.attr("src").lastIndexOf("/")) + '/';
                            if (isFieldLocked == 'true') {
                                ConsoleLog("\t\tEnable Unlock for field & disable clear <" + fieldName + ">");
                                $(".BCSB_divUNLOCKICON[fieldName='" + fieldName + "']").show(0);
                                $(".BCSB_divLOCKICON[fieldName='" + fieldName + "']").hide(0);
                                $(".BCSB_divCLEARICON[fieldName='" + fieldName + "']").hide(0);
                                $imgStatus.attr("src", imgBasePath + 'blue.png');
                            }
                            else {
                                ConsoleLog("\t\tEnable Lock & clear for field <" + fieldName + ">");
                                $(".BCSB_divUNLOCKICON[fieldName='" + fieldName + "']").hide(0);
                                $(".BCSB_divLOCKICON[fieldName='" + fieldName + "']").show(0);
                                $(".BCSB_divCLEARICON[fieldName='" + fieldName + "']").show(0);
                                $imgStatus.attr("src", imgBasePath + 'green.png');
                            }
                        }
                        else {
                            ConsoleLog("\t\tNothing to do for field <" + fieldName + ">");
                        }
                    }
                }
            }
            

            // ------------------------------------------------------------------
            // Data Related
            // ------------------------------------------------------------------
            function getData()
            {
                var lineDelimiter = '\n';
                var tagDelimiter = ':';
                var valueDelimiter = ';';

                var currentSelectionQv = _this.Layout.RefValue0.label;
                var arrSelectionLines = currentSelectionQv.split(lineDelimiter);

                if (arrSelectionLines.length > 0 && arrSelectionLines[0] != '-') {
                    for (i = 0; i < arrSelectionLines.length; i++) {
                        var line = arrSelectionLines[i];
                        var tagPos = line.indexOf(tagDelimiter);
                        var fieldName = line.substr(0, tagPos);

                        var fieldValues = line.substr(tagPos + 1, line.length - tagPos).split(valueDelimiter);
                        _this.ExtSelections[i] = {};
                        _this.ExtSelections[i].FieldName = fieldName;
                        _this.ExtSelections[i].Values = fieldValues;
                        _this.ExtSelections[i].RowNo = i+1;
                        _this.ExtSelections[i].IsHidden = isHidden(fieldName);
                    }
                }
                else
                {
                    _this.ExtSelections = null;
                }
            }

            function isHidden(fieldKey)
            {
                if (!nullOrEmpty(_this.ExtSettings.HideFields)) {
                    var arrHiddenFields = _this.ExtSettings.HideFields.split(',');
                    if (Array.isArray(arrHiddenFields))
                    {
                        //ConsoleLog(arrHiddenFields);
                        //ConsoleLog("indexof " + fieldKey + ": " + arrHiddenFields.indexOf(fieldKey));
                        if (arrHiddenFields.indexOf(fieldKey) > -1)
                        {
                            return true;
                        }
                    }
                }
                if (!nullOrEmpty(_this.ExtSettings.HidePrefixes)) {
                    var arrHidePrefixes = _this.ExtSettings.HidePrefixes.split(',');
                    if (Array.isArray(arrHidePrefixes)) {
                        for (var i = 0; i < arrHidePrefixes.length; i++) {
                            if (fieldKey.startsWith(arrHidePrefixes[i])) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            // ------------------------------------------------------------------
            // Settings
            // ------------------------------------------------------------------
            function InitSettings()
            {
                ConsoleInfo("Init Settings");

                _this.ExtSettings.UniqueId = _this.Layout.ObjectId.replace("\\", "_");

                _this.ExtSettings.ShowStatus = _this.Layout.Text0.text == '1' ? true : false;
                _this.ExtSettings.ShowValues = (_this.Layout.Text1.text == '1') ? true : false;
                _this.ExtSettings.ShowClearIcon = (_this.Layout.Text2.text == '1') ? true : false;
                _this.ExtSettings.ShowLockIcon = (_this.Layout.Text3.text == '1') ? true : false;

                _this.ExtSettings.IconStyle = _this.Layout.Text4.text;
                ConsoleLog("\tIcon Style:" + _this.ExtSettings.IconStyle);

                _this.ExtSettings.LabelField = _this.Layout.Text5.text;
                _this.ExtSettings.LabelValues = _this.Layout.Text7.text;

                _this.ExtSettings.ShowHeader = _this.Layout.Text6.text == '1' ? true : false;

                // Hide Prefixes
                _this.ExtSettings.HidePrefixes = _this.Layout.Text11.text;
                ConsoleLog("\tHidePrefixes:" + _this.ExtSettings.HidePrefixes);

                _this.ExtSettings.HideFields = _this.Layout.Text12.text;
                ConsoleLog("\tHideFields: " + _this.ExtSettings.HideFields);

                // Some settings need to be set directly                
                renderSettings();

            }

            function renderSettings() {
            	/// <summary>
                /// Render values which are not re-rendered every time (mainly those which are part of the
                /// header and not the body of the current selections box)
            	/// </summary>

                $("#" + _this.ExtSettings.UniqueId + "_FieldHeader").html(_this.ExtSettings.LabelField);
                $("#" + _this.ExtSettings.UniqueId + "_ValueHeader").html(_this.ExtSettings.LabelValues);

                $("#" + _this.ExtSettings.UniqueId + "_HeaderRow").showHide(_this.ExtSettings.ShowHeader);
                $("#" + _this.ExtSettings.UniqueId + "_ValueHeader").showHide(_this.ExtSettings.ShowValues);

            }


            // ------------------------------------------------------------------
            // Rendering the selection box
            // ------------------------------------------------------------------
            //#region RenderSelections

            function renderSelectionBox()
            {
                ConsoleInfo("Render Current Selections Box ...");
                $(_this.Element).css("overflow", "auto");
                if ($('#' + _this.ExtSettings.UniqueId + "_Table").length == 0) {
                    var $tblSelectionBox = $(document.createElement("table"));
                    $tblSelectionBox.attr("id", _this.ExtSettings.UniqueId + "_Table");
                    $tblSelectionBox.addClass("tblBetterCurrentSelectionsBox");

                    // Resizable Support
                    $tblSelectionBox.attr('data-resizable-columns-id', _this.ExtSettings.UniqueId);

                    var $theadHeader = $(document.createElement("thead"));

                    // Header Row
                    var $trHeader = $(document.createElement("tr"));
                    $trHeader.attr('id', _this.ExtSettings.UniqueId + "_HeaderRow");
                    $trHeader.showHide(_this.ExtSettings.ShowHeader);

                    // Field Column
                    var $thFieldHeader = $(document.createElement("th"));
                    $thFieldHeader.attr("id", _this.ExtSettings.UniqueId + "_FieldHeader");
                    $thFieldHeader.attr('data-resizable-column-id', $thFieldHeader.attr('id'));
                    $thFieldHeader.html(_this.ExtSettings.LabelField);
                    $thFieldHeader.css("width", "30%");
                    setProps($thFieldHeader, _this);
                    $trHeader.append($thFieldHeader);

                    // Value Header
                    var $thValueHeader = $(document.createElement("th"));
                    $thValueHeader.attr("id", _this.ExtSettings.UniqueId + "_ValueHeader");
                    $thValueHeader.attr('data-resizable-column-id', $thValueHeader.attr('id'));
                    $thValueHeader.html(_this.ExtSettings.LabelValues);
                    //$thValueHeader.css("width", "60%");
                    setProps($thValueHeader, _this);
                    $trHeader.append($thValueHeader);

                    $theadHeader.append($trHeader);
                    $tblSelectionBox.append($theadHeader);

                    var $tbodyContent = $(document.createElement("tbody"));
                    $tbodyContent.attr("id", _this.ExtSettings.UniqueId + "_Content");
                    $tblSelectionBox.append($tbodyContent);

                    $(_this.Element).append($tblSelectionBox);
                   
                }
                //ConsoleLog("Config Table ... (Width, Height, etc.)");
                configTable();

            }

            function renderSelectionBoxContent() {
            	/// <summary>
            	/// Renders the current selections to the selectionbox table.
                /// </summary>
                
                ConsoleInfo("Render the SelectionBoxContent ...");
                
                var createClearHandler = function (rowNo, fieldName) {
                    return function () {
                        ConsoleLog("Clear Click Handler /row: " + rowNo + "/field: " + fieldName);
                        var G = {}; G.action = ""; G.position = "0:" + rowNo + ":Body";

                        // Search for any current selectionbox on the current sheet
                        var m = recurParseManagers('null', 'Document\\CS', null);
                        ConsoleLog("Current SelectionBox Index:" + m);
                        if (m != null)
                        {
                            ConsoleInfo("Send PageBinder Clear command ...");
                            Qva.GetBinder("").Set(m + ".CD", G);
                            Qva.GetBinder("").Send("");
                        }
                        else
                        {
                            alert('Clearing the selection is not possible, please contact your QlikView application developer to solve this behavior.\n\nReason: NoSelectionBox.');
                        }
                    };
                };

                var createLockHandler = function (rowNo, fieldName) {
                    return function () {
                        ConsoleLog("Lock Click Handler /row: " + rowNo + "/field: " + fieldName);

                        var G = {}; G.action = ""; G.position = "0:" + rowNo + "";
                        // Search for any current selectionbox
                        var m = recurParseManagers('null', 'Document\\CS', null);
                        ConsoleLog("Current SelectionBox Index:" + m);
                        if (m != null) {
                            Qva.GetBinder("").Set(m + ".LOC", G);
                            Qva.GetBinder("").Send("");
                        }
                        else {
                            alert('Locking the selection is not possible, please contact your QlikView application developer to solve this behavior.\n\nReason: NoSelectionBox.');
                        }
                    };
                };

                var createUnLockHandler = function (rowNo, fieldName) {
                    return function () {
                        ConsoleLog("UnLock Click Handler /row: " + rowNo + "/field: " + fieldName);
                        var G = {}; G.action = ""; G.position = "0:" + rowNo + ":Body";
                        // Search for any current selectionbox
                        var m = recurParseManagers('null', 'Document\\CS', null);
                        ConsoleLog("Current SelectionBox Index:" + m);
                        if (m != null) {
                            Qva.GetBinder("").Set(m + ".ULC", G);
                            Qva.GetBinder("").Send("");
                        }
                        else {
                            alert('UnLocking the selection is not possible, please contact your QlikView application developer to solve this behavior.\n\nReason: NoSelectionBox.');
                        }
                    };
                };

                var imageBasePath = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=Extensions/' + _this.ExtSettings.ExtensionName + '/lib/icons/';
                //var imageCss = 'url(' + imageUrl + ')';

                
                var $tableBody = $("#" + _this.ExtSettings.UniqueId + "_Content");
                if ($tableBody.length > 0) {
                    
                    $tableBodyNew = $(document.createElement("tbody"));

                    if (_this.ExtSelections != null && Object.keys(_this.ExtSelections).length > 0) {
                        ConsoleLog("Selections: " + Object.keys(_this.ExtSelections).length);
                        for (var r = 0; r < Object.keys(_this.ExtSelections).length; r++) {

                            if (_this.ExtSelections[r].IsHidden)
                            {
                                continue;
                            }

                            var fieldName = _this.ExtSelections[r].FieldName;
                            var rowNo = _this.ExtSelections[r].RowNo;
                            var transFieldName = getTranslatedFieldName(fieldName);

                            var $tr = $(document.createElement("tr"));
                            $tr.attr("fieldname", fieldName);
                            $tr.addClass("BCSB_Row");

                            // Field Name
                            var $tdFieldName = $(document.createElement("td"));
                            $tdFieldName.addClass("BCSB_FieldCol");
                            setProps($tdFieldName, _this);
                            $tdFieldName.html(nullOrEmpty(transFieldName) ? fieldName : transFieldName);

                            

                            // Lock Icon
                            if (_this.ExtSettings.ShowLockIcon) {
                                var $divLock = $(document.createElement("div"));
                                //$divLock.hide();
                                $divLock.attr('fieldname', fieldName);
                                $divLock.addClass("divRightAligned");
                                $divLock.addClass("BCSB_divLOCKICON");
                                $divLock.attr('title', 'Lock');
                                //$divLock.html("Lock");
                                $divLock.bind("click", createLockHandler(rowNo, fieldName));
                                var $imgLock = $(document.createElement("img"));
                                $imgLock.attr("src", imageBasePath + 'lock_' + _this.ExtSettings.IconStyle + '.png');
                                $divLock.append($imgLock);
                                $tdFieldName.append($divLock);
                            }

                            // Unlock Icon
                            if (_this.ExtSettings.ShowLockIcon) {
                                var $divUnLock = $(document.createElement("div"));
                                $divUnLock.attr('fieldname', fieldName);
                                $divUnLock.hide();
                                $divUnLock.addClass("divRightAligned");
                                $divUnLock.addClass("BCSB_divUNLOCKICON");
                                $divUnLock.attr('title', 'Unlock');
                                //$divUnLock.html("Unlock");
                                $divUnLock.bind("click", createUnLockHandler(rowNo, fieldName));
                                var $imgUnLock = $(document.createElement("img"));
                                $imgUnLock.attr("src", imageBasePath + 'unlock_' + _this.ExtSettings.IconStyle + '.png');
                                $divUnLock.append($imgUnLock);
                                $tdFieldName.append($divUnLock);
                            }

                            // Clear Icon
                            if (_this.ExtSettings.ShowClearIcon) {
                                var $divClear = $(document.createElement("div"));
                                //$divClear.hide();
                                $divClear.addClass("divRightAligned");
                                $divClear.addClass("BCSB_divCLEARICON");
                                $divClear.attr('fieldname', fieldName);
                                $divClear.bind("click", createClearHandler(rowNo, fieldName));

                                var $imgClear = $(document.createElement("img"));
                                $imgClear.attr("src", imageBasePath + 'clear_' + _this.ExtSettings.IconStyle + '.png');
                                $divClear.append($imgClear);
                                $tdFieldName.append($divClear);
                            }

                            $tr.append($tdFieldName);

                            // Field Values
                            var $tdFieldValues = $(document.createElement("td"));
                            setProps($tdFieldValues, _this);
                            var $imgStatus = $(document.createElement("img"));
                            $imgStatus.addClass("BCSB_imgStatus");
                            $imgStatus.attr("src", imageBasePath + 'green.png');
                            $imgStatus.showHide(_this.ExtSettings.ShowStatus);
                            $tdFieldValues.append($imgStatus);
                            $tdFieldValues.append(_this.ExtSelections[r].Values.join(','));
                            $tdFieldValues.showHide(_this.ExtSettings.ShowValues);
                            $tr.append($tdFieldValues);

                            $tableBodyNew.append($tr);
                        }
                        $tableBody.parent().append($tableBodyNew);
                        $tableBody.remove();
                        $tableBodyNew.attr("id", _this.ExtSettings.UniqueId + "_Content");
                    }
                    else {
                        $tableBody.empty();
                    }
               }
            }

            //#endregion

            
            //#region Update Selections
            function UpdateSelections() {
            	/// <summary>
                /// Fetches the current selections and updates the status of icons and
                /// markers. 
                /// </summary>
                /// <remarks>
                /// This is necessary because from GetCurrentSelections we do
                /// not receive the information if a single field is locked or not.
                /// </remarks>
                if (_this.ExtSelections != null && Object.keys(_this.ExtSelections).length > 0) {
                    for (var r = 0; r < Object.keys(_this.ExtSelections).length; r++) {
                        // Array for fieldoptionos
                        var fields = [];
                        var f = { "name": _this.ExtSelections[r].FieldName };
                        fields.push(f);
                    }

                    // Finally check which fields are locked and not
                    var currentSelectionOptions =
                    {
                        onChange: function () {
                            var data = this.Data.Rows;
                            ConsoleInfo("Data returned from GetCurrentSelections");
                            ConsoleLog(this.Data.Rows);
                            gBCSB_Selections = this.Data;
                        },
                        fields: [fields]
                    };
                    ConsoleInfo("Retrieve the current selections to config lock/unlock icons");
                    Qv.GetCurrentDocument().GetCurrentSelections(currentSelectionOptions);
                }
            }
            ///#endregion

            function configTable()
            {
                var $tbl = $('#' + _this.ExtSettings.UniqueId + "_Table");
                if ($tbl.length > 0) {
                    //$tbl.attr("border", "1");
                    //$tbl.colResizable({
                    //    disable: false
                    //});

                    $tbl.width(_this.GetWidth() + "px");
                    //$tbl.height(_this.GetHeight() + "px");

                    //$tbl.colResizable({
                    //    disable: false
                    //});
                }
                $(function () {
                    $('#' + _this.ExtSettings.UniqueId + "_Table").resizableColumns();
                });
            }

            
            // ------------------------------------------------------------------
            // Extension Helper
            // ------------------------------------------------------------------
            function SupportSelectBox() {
                /// <summary>
                /// Bugfixes the issue with select boxes on the property page.
                /// </summary>
                /// <remarks>
                /// Just place this code to the extensio page and everything will work fine.
                /// </remarks>

                if (Qva.Mgr.mySelect == undefined) {
                    Qva.Mgr.mySelect = function (owner, elem, name, prefix) {
                        if (!Qva.MgrSplit(this, name, prefix)) return;
                        owner.AddManager(this);
                        this.Element = elem;
                        this.ByValue = true;

                        elem.binderid = owner.binderid;
                        elem.Name = this.Name;

                        elem.onchange = Qva.Mgr.mySelect.OnChange;
                        elem.onclick = Qva.CancelBubble;
                    }
                    Qva.Mgr.mySelect.OnChange = function () {
                        var binder = Qva.GetBinder(this.binderid);
                        if (!binder.Enabled) return;
                        if (this.selectedIndex < 0) return;
                        var opt = this.options[this.selectedIndex];
                        binder.Set(this.Name, 'text', opt.value, true);
                    }
                    Qva.Mgr.mySelect.prototype.Paint = function (mode, node) {
                        this.Touched = true;
                        var element = this.Element;
                        var currentValue = node.getAttribute("value");
                        if (currentValue == null) currentValue = "";
                        var optlen = element.options.length;
                        element.disabled = mode != 'e';
                        //element.value = currentValue;
                        for (var ix = 0; ix < optlen; ++ix) {
                            if (element.options[ix].value === currentValue) {
                                element.selectedIndex = ix;
                            }
                        }
                        element.style.display = Qva.MgrGetDisplayFromMode(this, mode);
                    }
                }
            }


            // ------------------------------------------------------------------
            // Basic table Rendering
            // ------------------------------------------------------------------


            function renderTable() {

                var createClickHandler =
                        function (rowIndex) {
                            return function () {
                                _this.Data.SelectRow(rowIndex);
                            };
                        };

                // Data.SelectValuesInColumn(columnIdx, values, toggle, isFinal)
                var createClickHandler2 =
                    function (colIdx, values) {
                        return function () {
                            _this.Data.SelectTextsInColumn(colIdx, true, values)
                        }
                    }

                while (_this.Element.firstChild) _this.Element.removeChild(_this.Element.firstChild);
                var mytable = document.createElement("table");
                mytable.style.width = "100%";
                var noCols = _this.Data.HeaderRows[0].length;
                var tablebody = document.createElement("tbody");
                for (var r = 0; r < _this.Data.HeaderRows.length; r++) {
                    var row = document.createElement("tr");
                    for (var c = 0; c < noCols; c++) {
                        var cell = document.createElement("td");
                        cell.innerHTML = _this.Data.HeaderRows[r][c].text;
                        row.appendChild(cell);
                    }
                    tablebody.appendChild(row);
                }
                for (var r = 0; r < _this.Data.Rows.length; r++) {
                    var row = document.createElement("tr");
                    for (var c = 0; c < noCols; c++) {
                        var cell = document.createElement("td");

                        var cellValue = _this.Data.Rows[r][c].text;
                        cell.innerHTML = cellValue;
                        //cell.innerHTML = _this.Data.Rows[r][c].text;

                        //cell.onclick = createClickHandler(r);
                        cell.onclick = createClickHandler2(c, cellValue);

                        row.appendChild(cell);
                    }
                    tablebody.appendChild(row);
                }
                mytable.appendChild(tablebody);
                _this.Element.appendChild(mytable);
            }


            // ------------------------------------------------------------------
            // Internal help
            // ------------------------------------------------------------------
            function getTranslatedFieldName(fieldKey) {
                //ConsoleLog("getTranslatedFieldName: Finding the translated field name for " + fieldKey);
                for (var r = 0; r < _this.Data.Rows.length; r++) {
                    var key = _this.Data.Rows[r][0].text;
                    var val = _this.Data.Rows[r][1].text
                    //ConsoleLog("\tKey line " + r + ": " + key);
                    if (key == fieldKey) {
                        return val;
                    }
                }
            }

            function recurParseManagers(mgr, nm, ret) {
                var mg = mgr;
                if (mg == 'null') {
                    mg = Qva.GetBinder("").Managers;
                }
                for (var a = 0; a < mg.length; ++a) {
                    var b = mg[a];
                    //ConsoleLog(b);
                    if (b.Name) {
                        //ConsoleLog(b.Name);
                        if (b.Element && b.Element.TargetName) {
                            //ConsoleLog(b.Element.TargetName);
                            if (b.Element.TargetName.indexOf(nm) != -1) {
                                //ConsoleLog('\t' + b.Element.TargetName);
                            }
                        }
                    }

                    if (b.Name && b.Element && b.Element.TargetName && b.Element.TargetName.indexOf(nm) != -1) {
                        //ConsoleLog(b);
                        ret = b.Name.split(".")[1];
                        ConsoleLog("\tIndex Of target control: " + ret);
                        return ret;
                    }
                    if (b.Managers)
                        ret = recurParseManagers(b.Managers, nm, ret);
                }
                return ret;
            }

            

            function setProps($obj, parentObj) {

                // Copy font properties from extension object
                //obj.style.fontStyle = parentObj.Layout.Style.fontstyle;
                //obj.style.fontFamily = parentObj.Layout.Style.fontfamily;
                //obj.style.fontSize = parentObj.Layout.Style.fontsize + "pt";
                $obj.css("font-size", parentObj.Layout.Style.fontsize + "pt");
                $obj.css("font-family", parentObj.Layout.Style.fontfamily);


                // Copy padding properties from extension object
                //obj.style.paddingTop = parentObj.Layout.Style.radiustopleft + "px";
                //obj.style.paddingLeft = parentObj.Layout.Style.radiustopleft + "px";
                //obj.style.paddingRight = parentObj.Layout.Style.radiustopright + "px";

            }


            // ------------------------------------------------------------------
            // Extension helper functions
            // ------------------------------------------------------------------
            function ConsoleLog(msg) {
                if (typeof console != "undefined") {
                    console.log(msg);
                }
            }
            function ConsoleInfo(msg) {
                if (typeof console != "undefined") {
                    console.info(msg);
                }
            }
            function ConsoleError(msg) {
                if (typeof console != "undefined") {
                    console.error(msg);
                }
            }
            function ConsoleWarn(msg) {
                if (typeof console != "undefined") {
                    console.warn(msg);
                }
            }
            function ConsoleClear() {
                if (typeof console != "undefined") {
                    console.clear();
                }
            }

            // Basic Helper functions
            function nullOrEmpty(obj) {
                if (obj == null || obj.length == 0 || obj == 'undefined') {
                    return true;
                }
                return false;
            }

            // String extension
            String.prototype.startsWith = function(s)
            {
                return(this.indexOf(s) == 0);
            };

            



        })
};

BetterCurrentSelectionsBox_Init();
