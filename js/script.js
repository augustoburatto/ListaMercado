$(document).ready(function() {
    let totalValue = 0;
    let itemList = JSON.parse(localStorage.getItem('itemList')) || [];

    function updateTotal() {
        totalValue = 0;
        itemList.forEach(function(item) {
            const totalItemValue = item.quantity * item.unitValue;
            totalValue += totalItemValue;
        });
        $("#total-value").text("Total: R$ " + totalValue.toFixed(2));
    }

    function saveItemList() {
        localStorage.setItem('itemList', JSON.stringify(itemList));
    }

    function renderItemList() {
        $("#item-list").empty();
        itemList = itemList.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar a lista em ordem alfabética

        itemList.forEach(function(item, index) {
            const unitValue = item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const totalValue = (item.quantity * item.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const newRow = `<tr data-index="${index}">
                <td>${item.name}</td>
                <td class="item-quantity">${item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="item-unit-value">${unitValue}</td>
                <td class="item-total-value">${totalValue}</td>
                <td><input type="checkbox" class="item-taken" ${item.taken ? 'checked' : ''}></td>
                <td><span class="remove-item">Remover</span></td>
            </tr>`;
            $("#item-list").append(newRow);
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

    $("#item-list").sortable({
        update: function(event, ui) {
            const newIndex = ui.item.index();
            const oldIndex = ui.item.data("index");

            const tempItem = itemList[newIndex];
            itemList[newIndex] = itemList[oldIndex];
            itemList[oldIndex] = tempItem;

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
