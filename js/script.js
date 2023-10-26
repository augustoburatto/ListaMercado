$(document).ready(function() {
    let totalValue = 0;
    const itemList = JSON.parse(localStorage.getItem('itemList')) || [];

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
        itemList.forEach(function(item) {
            const unitValue = item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const totalValue = (item.quantity * item.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const newRow = `<tr>
                <td>${item.name}</td>
                <td class="item-quantity">${item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="item-unit-value">${unitValue}</td>
                <td class="item-total-value">${totalValue}</td>
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
        const rowIndex = $(this).closest("tr").index();
        itemList.splice(rowIndex, 1);
        saveItemList();
        renderItemList();
        updateTotal();
    });
});
