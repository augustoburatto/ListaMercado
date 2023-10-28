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
});
