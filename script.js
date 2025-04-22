
function addItem() {
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const priceInput = document.getElementById("itemPrice").value.trim();
  const largePriceInput = document.getElementById("itemLargePrice").value.trim();

  if (!name || !category || !priceInput) {
    alert("請輸入餐點名稱、分類與一般價格");
    return;
  }

  const price = parseInt(priceInput);
  const largePrice = largePriceInput ? parseInt(largePriceInput) : null;

  menuItems.push({ name, category, price, largePrice });
  renderMenuList();
  renderMenu();
  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("itemLargePrice").value = "";
}

function renderMenu() {
  const menuDiv = document.getElementById("menu");
  const selectedCategory = document.querySelector("#category-buttons .active")?.dataset.category || "全部";

  menuDiv.innerHTML = "";

  // 功能 1：分類 + 名稱排序
  const items = menuItems
    .filter(item => selectedCategory === "全部" || item.category === selectedCategory)
    .sort((a, b) => {
      if (a.category === b.category) {
        return a.name.localeCompare(b.name, "zh-Hant");
      }
      return a.category.localeCompare(b.category, "zh-Hant");
    });

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.backgroundColor = getCategoryColor(item.category);
    card.innerHTML = `
      <div style="font-size: 20px;">${item.name}</div>
      <div style="font-weight: normal;">${item.category}</div>
      <div>一般 $${item.price} <button onclick="addToOrder('${item.name}', ${item.price})">選</button></div>
      ${item.largePrice ? `<div>大份 $${item.largePrice} <button onclick="addToOrder('${item.name}（大份）', ${item.largePrice})">選</button></div>` : ""}
    `;
    menuDiv.appendChild(card);
  });
}
