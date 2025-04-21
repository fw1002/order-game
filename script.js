
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBY2JkCQErm8pyh2B1uCZmeuDohi8DNces",
  authDomain: "order-game-3a2c3.firebaseapp.com",
  databaseURL: "https://order-game-3a2c3-default-rtdb.firebaseio.com",
  projectId: "order-game-3a2c3",
  storageBucket: "order-game-3a2c3.appspot.com",
  messagingSenderId: "793590994015",
  appId: "1:793590994015:web:d089bf8bea249a3837f7ea"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const orderRef = ref(db, "orders");

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

function renderMenu() {
  const menu = document.getElementById("menu");
  const catButtons = document.getElementById("category-buttons");
  menu.innerHTML = "";
  catButtons.innerHTML = "<button onclick='renderMenu()'>全部</button>";
  categories.forEach(cat => {
    catButtons.innerHTML += `<button onclick="renderMenu('${cat.name}')">${cat.name}</button>`;
  });
  menuItems.filter(item => !window.filterCat || item.category === window.filterCat).forEach(item => {
    const cat = categories.find(c => c.name === item.category);
    menu.innerHTML += `<div class="menu-item" style="background:${cat?.color}">
      <strong>${item.name}</strong><br>
      ${item.category}<br>
      一般 $${item.price} <button onclick="addToOrder('${item.name}', ${item.price})">選擇</button><br>
      大份 $${item.largePrice} <button onclick="addToOrder('${item.name}(大)', ${item.largePrice})">選擇</button>
    </div>`;
  });
}
window.renderMenu = function(cat) {
  window.filterCat = cat;
  renderMenu();
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
  push(orderRef, { items: order, time: new Date().toISOString() });
  alert("訂單已送出");
  order = [];
  renderOrder();
}

function renderMenuList() {
  const ul = document.getElementById("menuList");
  ul.innerHTML = "";
  menuItems.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name}（${item.category}） - $${item.price}/$${item.largePrice} <button onclick="menuItems.splice(${i},1);renderMenu();renderMenuList();">刪除</button>`;
    ul.appendChild(li);
  });
}

function saveMenu() {
  const name = document.getElementById("menuName").value.trim();
  if (!name) return alert("請輸入菜單名稱");
  localStorage.setItem("menu_" + name, JSON.stringify({ categories, menuItems }));
  alert("已儲存菜單：" + name);
  renderSavedMenus();
}

function renderSavedMenus() {
  const select = document.getElementById("savedMenus");
  select.innerHTML = "<option value=''>--選擇已儲存菜單--</option>";
  for (let key in localStorage) {
    if (key.startsWith("menu_")) {
      const name = key.replace("menu_", "");
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }
  }
}

function loadMenu(name) {
  if (!name) return;
  const data = JSON.parse(localStorage.getItem("menu_" + name));
  if (!data) return;
  categories = data.categories || [];
  menuItems = data.menuItems || [];
  renderCategoryList();
  renderCategoryOptions();
  renderMenu();
  renderMenuList();
}

function deleteMenu() {
  const select = document.getElementById("savedMenus");
  const name = select.value;
  if (!name) return alert("請選擇要刪除的菜單");
  if (confirm("確定要刪除菜單：" + name + "？")) {
    localStorage.removeItem("menu_" + name);
    renderSavedMenus();
    alert("已刪除");
  }
}

window.switchMode = switchMode;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addItem = addItem;
window.submitOrder = submitOrder;
window.saveMenu = saveMenu;
window.loadMenu = loadMenu;
window.deleteMenu = deleteMenu;
window.addToOrder = addToOrder;

switchMode("order");
