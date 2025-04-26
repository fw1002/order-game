const firebaseConfig = {
  apiKey: "AIzaSyBY2JkCQErm8pyh2B1uCZmeuDohi8DNces",
  authDomain: "order-game-3a2c3.firebaseapp.com",
  databaseURL: "https://order-game-3a2c3-default-rtdb.firebaseio.com",
  projectId: "order-game-3a2c3",
  storageBucket: "order-game-3a2c3.appspot.com",
  messagingSenderId: "793590994015",
  appId: "1:793590994015:web:d089bf8bea249a3837f7ea"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const menuRef = db.ref("menus");

let categories = [];
let menuItems = [];
let order = [];

function switchMode(mode) {
  const orderMode = document.getElementById("order-mode");
  const editMode = document.getElementById("edit-mode");
  const orderModeBtn = document.getElementById("order-mode-btn");

  if (orderMode) orderMode.style.display = mode === "order" ? "block" : "none";
  if (editMode) editMode.style.display = mode === "edit" ? "block" : "none";
  if (orderModeBtn) orderModeBtn.style.display = mode === "edit" ? "inline-block" : "none";

  if (mode === "edit") {
    if (typeof renderCategoryList === "function") renderCategoryList();
    if (typeof renderMenuList === "function") renderMenuList();
    if (typeof renderSavedMenus === "function") renderSavedMenus();
  } else {
    if (typeof renderMenu === "function") renderMenu();
    if (typeof renderOrder === "function") renderOrder();
  }
}

function showStatusMessage(text) {
  let statusDiv = document.getElementById("statusMessage");
  if (!statusDiv) {
    statusDiv = document.createElement("div");
    statusDiv.id = "statusMessage";
    statusDiv.style.position = "fixed";
    statusDiv.style.top = "20px";
    statusDiv.style.left = "50%";
    statusDiv.style.transform = "translateX(-50%)";
    statusDiv.style.backgroundColor = "#333";
    statusDiv.style.color = "#fff";
    statusDiv.style.padding = "10px 20px";
    statusDiv.style.borderRadius = "10px";
    statusDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    statusDiv.style.zIndex = "9999";
    document.body.appendChild(statusDiv);
  }
  statusDiv.textContent = text;
  statusDiv.style.display = "block";

  clearTimeout(statusDiv.timer);
  statusDiv.timer = setTimeout(() => {
    statusDiv.style.display = "none";
  }, 2500); // 2.5秒後自動消失
}


function addCategory() {
  const nameEl = document.getElementById("newCategory");
  const colorEl = document.getElementById("categoryColor");
  const textColorEl = document.querySelector('input[name="categoryTextColor"]:checked');

  if (!nameEl || !colorEl) return;
  const name = nameEl.value.trim();
  const color = colorEl.value;
  const textColor = textColorEl?.value || "#ffffff";

  if (!name || !color) {
    alert("請輸入分類名稱與顏色");
    return;
  }

  categories.push({ name, color, textColor });
  renderCategoryList();
  renderCategoryOptions();
  renderMenu();
}

function deleteCategory(index) {
  const categoryName = categories[index].name;
  if (menuItems.some(item => item.category === categoryName)) {
    alert("請先刪除此分類下的餐點");
    return;
  }
  categories.splice(index, 1);
  renderCategoryList();
  renderCategoryOptions();
}

function renderCategoryList() {
  const ul = document.getElementById("categoryList");
  if (!ul) return;
  ul.innerHTML = "";
  categories.forEach((cat, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${cat.name}
      <input type="color" value="${cat.color}" onchange="categories[${i}].color=this.value; renderMenu(); saveCurrentMenu()">

      <label style="margin-left:10px;">
        <input type="radio" name="textColor-${i}" value="#ffffff" ${cat.textColor === "#ffffff" ? "checked" : ""} onchange="categories[${i}].textColor=this.value; renderMenu(); saveCurrentMenu()">
        白色字
      </label>
      <label style="margin-left:10px;">
        <input type="radio" name="textColor-${i}" value="#333333" ${cat.textColor === "#333333" ? "checked" : ""} onchange="categories[${i}].textColor=this.value; renderMenu(); saveCurrentMenu()">
        深灰字
      </label>

      <button onclick="deleteCategory(${i})" style="margin-left:10px;">刪除</button>
    `;
    ul.appendChild(li);
  });
}

function renderCategoryOptions() {
  const select = document.getElementById("itemCategory");
  if (!select) return;
  select.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.name;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

function addItem() {
  const nameEl = document.getElementById("itemName");
  const categoryEl = document.getElementById("itemCategory");
  const priceEl = document.getElementById("itemPrice");
  const largePriceEl = document.getElementById("itemLargePrice");

  if (!nameEl || !categoryEl || !priceEl || !largePriceEl) return;

  const name = nameEl.value.trim();
  const category = categoryEl.value;
  const price = parseInt(priceEl.value);
  const largePriceInput = largePriceEl.value.trim();
  const largePrice = largePriceInput ? parseInt(largePriceInput) : null;

  if (!name || isNaN(price)) return alert("請填寫餐點名稱與一般價格");

  menuItems.push({ name, category, price, largePrice });
  renderMenu();
  renderMenuList();
}

function renderMenu(filter = null) {
  const menu = document.getElementById("menu");
  const catButtons = document.getElementById("category-buttons");
  if (!menu || !catButtons) return;

  menu.innerHTML = "";
  catButtons.innerHTML = "<button onclick='renderMenu()'>全部</button>";
  categories.forEach(cat => {
    catButtons.innerHTML += `<button onclick="renderMenu('${cat.name}')">${cat.name}</button>`;
  });

  const items = menuItems
    .filter(item => !filter || item.category === filter)
    .sort((a, b) => {
      if (a.category === b.category) {
        return a.name.localeCompare(b.name, "zh-Hant");
      }
      return a.category.localeCompare(b.category, "zh-Hant");
    });

  items.forEach(item => {
    const cat = categories.find(c => c.name === item.category);
    const textColor = cat?.textColor || "#ffffff";
    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.backgroundColor = cat?.color || "#999";
    card.style.color = textColor;

    card.innerHTML = `
      <div style="font-size: 20px;">${item.name}</div>
      <div style="font-weight: normal;">${item.category}</div>
      <div>一般 $${item.price} <button onclick="addToOrder('${item.name}', ${item.price})">選</button></div>
      ${item.largePrice != null
        ? `<div>大份 $${item.largePrice} <button onclick="addToOrder('${item.name}（大份）', ${item.largePrice})">選</button></div>`
        : `<div style="height: 1.8em;"></div>`}
    `;

    menu.appendChild(card);
  });
}

function addToOrder(name, price) {
  order.push({ name, price });
  renderOrder();
}

function renderOrder() {
  const list = document.getElementById("orderList");
  const totalLabel = document.getElementById("totalPrice");
  if (!list || !totalLabel) return;

  list.innerHTML = "";
  let total = 0;

  order.forEach((item, index) => {
    total += item.price;

    const li = document.createElement("li");
  li.innerHTML = `${item.name} - $${item.price} 
  <button class="delete-btn" onclick="removeOrderItem(${index})">🗑️</button>`;

    list.appendChild(li);
  });

  totalLabel.textContent = "總金額：$" + total;
}

function removeOrderItem(index) {
  order.splice(index, 1);
  renderOrder();
}


function submitOrder() {
  if (!order.length) return alert("請先點餐");

  // ✅ 同時支援桌機與手機版的下拉選單 ID
  const select =
    document.getElementById("savedMenus") ||
    document.getElementById("savedMenusMobile");

  const menuName = select?.value.trim() || "default";
  const orderPath = db.ref("orders/" + menuName);
  orderPath.push({ items: order, time: new Date().toISOString() });

  alert("訂單已送出");
  order = [];
  renderOrder();
}


function renderMenuList() {
  const ul = document.getElementById("menuList");
  if (!ul) return;
  ul.innerHTML = "";
  menuItems.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} (${item.category}) - $${item.price}${item.largePrice !== null ? `/$${item.largePrice}` : ""} <button onclick="menuItems.splice(${i},1);renderMenu();renderMenuList()">刪除</button>`;
    ul.appendChild(li);
  });
}

function saveMenu() {
  const input = document.getElementById("menuName");
  if (!input) return;
  const name = input.value.trim();
  if (!name) return alert("請輸入菜單名稱");

  showStatusMessage("⏳ 儲存中，請稍候...");

  db.ref("menus/" + name).set({ categories, menuItems }, (error) => {
    if (error) {
      showStatusMessage("❌ 儲存失敗，請再試一次");
      console.error(error);
    } else {
      showStatusMessage("✅ 已儲存並載入菜單：" + name);

      renderSavedMenus();

      const select = document.getElementById("savedMenus");
      if (select) select.value = name;

      loadMenu(name);
    }
  });
}


function renderSavedMenus() {
  const select = document.getElementById("savedMenus");
  if (!select) return;
  select.innerHTML = "<option value=''>--選擇已儲存菜單--</option>";
  menuRef.once("value", snapshot => {
    if (snapshot.exists()) {
      Object.keys(snapshot.val()).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      });
    }
  });
}

function loadMenu(name, callback) {
  if (!name) return;
  db.ref("menus/" + name).once("value", snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      categories = data.categories || [];
      menuItems = data.menuItems || [];

      if (typeof renderCategoryList === "function") renderCategoryList();
      if (typeof renderCategoryOptions === "function") renderCategoryOptions();
      if (typeof renderMenu === "function") renderMenu();
      if (typeof renderMenuList === "function") renderMenuList();

      if (typeof callback === "function") callback(); // ✅ 手機版會用這個補 renderMenu
    }
  });
}

function deleteMenu() {
  const select = document.getElementById("savedMenus");
  const name = select?.value;
  if (!name) return alert("請選擇要刪除的菜單");

  if (confirm("確定要刪除菜單：" + name + "？")) {
    db.ref("menus/" + name).remove();
    alert("已刪除");
    renderSavedMenus();
  }
}

// 預設切換到點餐模式
switchMode("order");

function saveCurrentMenu() {
  const select = document.getElementById("savedMenus");
  const menuName = select?.value;
  if (!menuName) return; // 沒選菜單就不做

  db.ref("menus/" + menuName).set({ categories, menuItems });
}
