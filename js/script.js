$(document).ready(function() {
    let totalValue = 0;
    let itemList = JSON.parse(localStorage.getItem('itemList')) || [];

    function updateTotal() {
        totalValue = 0;
        itemList.forEach(function(item) {
            if (item === null || typeof item === 'undefined') {
                return;
            }
            const totalItemValue = item.quantity * item.unitValue;
            totalValue += totalItemValue;
        });
        $("#total-value").text("Total: R$ " + totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    }

    function saveItemList() {
        $(".item-taken").each(function()
        {
            var idx = $(this).parents('tr').data('index');
            if (itemList[idx] === null || typeof itemList[idx] === 'undefined') {
                return;
            }
            itemList[idx].taken = $(this).prop('checked');
        });

        localStorage.setItem('itemList', JSON.stringify(itemList));
    }

    function renderItemList() {
        $("#item-list").empty();
        // itemList = itemList.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar a lista em ordem alfabética

        itemList.forEach(function(item, index) {
            if (item === null || typeof item === 'undefined') {
                return;
            }
            const unitValue = item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const totalValue = (item.quantity * item.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const newRow = `<tr data-index="${index}">
                <td>${item.name}</td>
                <td class="item-quantity">
                    <span class="item-quantity-${index}">${item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <input name="item-quantity-${index}" class="item-quantity-${index}" type="number" step="0.01" value="" style="display: none;width: 70px;height: 25px;">
                    <button id="edit-item-quantity" class="edit-item-quantity-${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                    </svg>
                    </button>
                    <button id="save-item-quantity" class="save-item-quantity-${index}" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512">
                        <!--!Font Awesome Free v5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                        <path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"/>
                    </svg>
                    </button>
                </td>
                <td class="item-unit-value">
                    <span class="item-unit-value-${index}">${unitValue}</span>
                    <input name="item-unit-value-${index}" class="item-unit-value-${index}" type="number" step="0.01" value="" style="display: none;width: 70px;height: 25px;">
                    <button id="edit-item-value" class="edit-item-value-${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                    </svg>
                    </button>
                    <button id="save-item-value" class="save-item-value-${index}" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512">
                        <!--!Font Awesome Free v5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                        <path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"/>
                    </svg>
                    </button>
                </td>
                <td class="item-total-value">${totalValue}</td>
                <td><input name="item-marcado" type="checkbox" class="item-taken" ${item.taken ? 'checked' : ''}></td>
                <td><span class="remove-item">Remover</span></td>
            </tr>`;
            $("#item-list").append(newRow);
        });

        $("button#edit-item-value").click(function()
        {
            var editButtonClass = $(this).attr("class");
            
            var inputClass = editButtonClass.replace("edit-item-value", "item-unit-value");
            $("input."+inputClass).show();
            var value = $("span."+inputClass).text();
            $("input."+inputClass).val(value.replace(",", "."));
            
            var saveButtonClass = editButtonClass.replace("edit", "save");
            $("button."+saveButtonClass).show();

            $(this).hide();
            $("span."+inputClass).text('');
        });

        $("button#edit-item-quantity").click(function()
        {
            var editButtonClass = $(this).attr("class");
            
            var inputClass = editButtonClass.replace("edit-item-quantity", "item-quantity");
            $("input."+inputClass).show();
            var value = $("span."+inputClass).text();
            $("input."+inputClass).val(value.replace(",", "."));
            
            var saveButtonClass = editButtonClass.replace("edit", "save");
            $("button."+saveButtonClass).show();

            $(this).hide();
            $("span."+inputClass).text('');
        });

        $("button#save-item-value").click(function()
        {
            var saveButtonClass = $(this).attr("class");

            var inputClass = saveButtonClass.replace("save-item-value", "item-unit-value");
            $("input."+inputClass).hide();
            var value = $("input."+inputClass).val();
            $("span."+inputClass).text(value);

            var editButtonClass = saveButtonClass.replace("save", "edit");
            $("button."+editButtonClass).show();

            $(this).hide();

            var idx = saveButtonClass.replace("save-item-value-", "");
            itemList[idx]['unitValue'] = parseFloat(value.replace(',', '.'));

            saveItemList();
            renderItemList();
            updateTotal();
        });

        $("button#save-item-quantity").click(function()
        {
            var saveButtonClass = $(this).attr("class");

            var inputClass = saveButtonClass.replace("save-item-quantity", "item-quantity");
            $("input."+inputClass).hide();
            var value = $("input."+inputClass).val();
            $("span."+inputClass).text(value);

            var editButtonClass = saveButtonClass.replace("save", "edit");
            $("button."+editButtonClass).show();

            $(this).hide();

            var idx = saveButtonClass.replace("save-item-quantity-", "");
            itemList[idx]['quantity'] = parseFloat(value.replace(',', '.'));

            saveItemList();
            renderItemList();
            updateTotal();
        });
    }

    function exportCSV() {
        const csvContent = "data:text/csv;charset=utf-8," + itemList.map(item => `${item.name};${item.quantity};${item.unitValue}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lista_compras.csv");
        document.body.appendChild(link);
        link.click();
    }

    function importCSV(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvData = e.target.result;
            const lines = csvData.split("\n");
            itemList = [];
            lines.forEach(function(line) {
                const values = line.split(";");
                if (values.length === 3) {
                    const itemName = values[0].trim();
                    const itemQuantity = parseFloat(values[1].trim());
                    const itemValue = parseFloat(values[2].trim());
                    if (itemName !== "" && itemQuantity > 0 && itemValue > 0) {
                        itemList.push({ name: itemName, quantity: itemQuantity, unitValue: itemValue, taken: false });
                    }
                }
            });
            saveItemList();
            renderItemList();
            updateTotal();
        };
        reader.readAsText(file);
    }

    updateTotal();
    renderItemList();

    $("#item-form").submit(function(e) {
        e.preventDefault();
        const itemName = $("#item-name").val();
        const itemQuantity = parseFloat($("#item-quantity").val().replace(',', '.'));
        const itemValue = parseFloat($("#item-value").val().replace(',', '.'));

        if (itemName !== "" && itemQuantity > 0 && itemValue > 0) {
            itemList.push({ name: itemName, quantity: itemQuantity, unitValue: itemValue });
            saveItemList();
            renderItemList();
            $("#item-name").val("");
            $("#item-quantity").val("");
            $("#item-value").val("");
            updateTotal();
        }
    });

    $("#item-list").on("click", ".remove-item", function() {
        const rowIndex = $(this).closest("tr").data("index");
        itemList.splice(rowIndex, 1);
        saveItemList();
        renderItemList();
        updateTotal();
    });

    let oldIndex;

    $("#item-list").sortable({
        start: function(event, ui) {
            oldIndex = ui.item.index();   // salva posição original antes de mover
        },
        update: function(event, ui) {
            const newIndex = ui.item.index(); // posição final

            // Pega o item removido
            const movedItem = itemList.splice(oldIndex, 1)[0];

            // Insere o item na nova posição
            itemList.splice(newIndex, 0, movedItem);

            saveItemList();
        }
    });

    $("#export-button").on("click", function() {
        exportCSV();
    });

    $("#import-file").on("change", function() {
        const file = this.files[0];
        importCSV(file);
    });
});
