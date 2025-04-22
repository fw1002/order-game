
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
  document.getElementById("order-mode").style.display = mode === "order" ? "block" : "none";
  document.getElementById("edit-mode").style.display = mode === "edit" ? "block" : "none";
  if (mode === "edit") {
    renderCategoryList();
    renderMenuList();
    renderSavedMenus();
  } else {
    renderMenu();
    renderOrder();
  }
}

function addCategory() {
  const name = document.getElementById("newCategory").value.trim();
  const color = document.getElementById("categoryColor").value;
  if (!name) return alert("請輸入分類名稱");
  categories.push({ name, color });
  renderCategoryList();
  renderCategoryOptions();
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
  ul.innerHTML = "";
  categories.forEach((cat, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${cat.name} <input type="color" value="${cat.color}" onchange="categories[${i}].color=this.value"> <button onclick="deleteCategory(${i})">刪除</button>`;
    ul.appendChild(li);
  });
}

function renderCategoryOptions() {
  const select = document.getElementById("itemCategory");
  select.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.name;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

function addItem() {
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const price = parseInt(document.getElementById("itemPrice").value);
  const largePrice = parseInt(document.getElementById("itemLargePrice").value);
  if (!name || isNaN(price) || isNaN(largePrice)) return alert("請填寫完整餐點資訊");
  menuItems.push({ name, category, price, largePrice });
  renderMenu();
  renderMenuList();
}

function renderMenu(filter = null) {
  const menu = document.getElementById("menu");
  const catButtons = document.getElementById("category-buttons");
  menu.innerHTML = "";
  catButtons.innerHTML = "<button onclick='renderMenu()'>全部</button>";
  categories.forEach(cat => {
    catButtons.innerHTML += `<button onclick="renderMenu('${cat.name}')">${cat.name}</button>`;
  });
  menuItems.filter(item => !filter || item.category === filter).forEach(item => {
    const cat = categories.find(c => c.name === item.category);
    menu.innerHTML += `<div class="menu-item" style="background:${cat?.color}">
      <strong>${item.name}</strong><br>${item.category}<br>
      一般 $${item.price} <button onclick="addToOrder('${item.name}', ${item.price})">選</button><br>
      大份 $${item.largePrice} <button onclick="addToOrder('${item.name} (大)', ${item.largePrice})">選</button>
    </div>`;
  });
}

function addToOrder(name, price) {
  order.push({ name, price });
  renderOrder();
}

function renderOrder() {
  const list = document.getElementById("orderList");
  list.innerHTML = "";
  let total = 0;
  order.forEach(item => {
    total += item.price;
    const li = document.createElement("li");
    li.textContent = `${item.name} - $${item.price}`;
    list.appendChild(li);
  });
  document.getElementById("totalPrice").textContent = "總金額：$" + total;
}

function submitOrder() {
  if (!order.length) return alert("請先點餐");
  const menuName = document.getElementById("savedMenus").value.trim() || "default";
  const orderPath = db.ref("orders/" + menuName);
  orderPath.push({ items: order, time: new Date().toISOString() });
  alert("訂單已送出");
  order = [];
  renderOrder();
}

function renderMenuList() {
  const ul = document.getElementById("menuList");
  ul.innerHTML = "";
  menuItems.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} (${item.category}) - $${item.price}/$${item.largePrice} <button onclick="menuItems.splice(${i},1);renderMenu();renderMenuList()">刪除</button>`;
    ul.appendChild(li);
  });
}

function saveMenu() {
  const name = document.getElementById("menuName").value.trim();
  if (!name) return alert("請輸入菜單名稱");
  db.ref("menus/" + name).set({ categories, menuItems });
  alert("已儲存至雲端菜單：" + name);
  renderSavedMenus();
  document.getElementById("savedMenus").value = name;
  loadMenu(name);
}

function renderSavedMenus() {
  const select = document.getElementById("savedMenus");
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

function loadMenu(name) {
  if (!name) return;
  db.ref("menus/" + name).once("value", snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      categories = data.categories || [];
      menuItems = data.menuItems || [];
      renderCategoryList();
      renderCategoryOptions();
      renderMenu();
      renderMenuList();
    }
  });
}

function deleteMenu() {
  const name = document.getElementById("savedMenus").value;
  if (!name) return alert("請選擇要刪除的菜單");
  if (confirm("確定要刪除菜單：" + name + "？")) {
    db.ref("menus/" + name).remove();
    alert("已刪除");
    renderSavedMenus();
  }
}

switchMode("order");
