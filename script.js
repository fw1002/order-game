// 初始化
const firebaseConfig = {
  apiKey: "AIzaSyBpXLkIwSKwuNIHcBOd1LfUNl-SQ7Hw9iY",
  authDomain: "order-game-home.firebaseapp.com",
  databaseURL: "https://order-game-home-default-rtdb.firebaseio.com",
  projectId: "order-game-home",
  storageBucket: "order-game-home.appspot.com",
  messagingSenderId: "1002665277636",
  appId: "1:1002665277636:web:042f46862f9cbc06907191",
  measurementId: "G-YJ4P4QZRJV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const menuRef = db.ref("menus");


let currentMenuName = "";
let categories = [];
let menuItems = [];
let order = [];
let currentOrderRef = null;
let hasInitialRender = false; // 為了避免初次載入時誤判狀態變更
// ✅ 全域變數：目前使用中的菜單名稱
let savedMenuName = localStorage.getItem('currentMenuName') || "";

window.addEventListener("DOMContentLoaded", () => {
  if (savedMenuName) {
    loadMenu(savedMenuName);    
  }


// ✅ 模式切換（編輯模式 <-> 點餐模式）
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
    // ✅ 點餐模式：儲存目前所選的菜單名稱
    const selectedMenu = document.getElementById("menuSelector");
    if (selectedMenu) {
      savedMenuName = selectedMenu.value;
      localStorage.setItem("currentMenuName", savedMenuName);
    }

    if (typeof renderMenu === "function") renderMenu();
    if (typeof renderOrder === "function") renderOrder();
    if (typeof renderOrderHistory === "function") renderOrderHistory();
  }
}


// 🔥 顯示訂單歷史
function renderOrderHistory() {
  const historyDiv = document.getElementById("orderHistory");
  if (!historyDiv) return;

  historyDiv.innerHTML = "載入中...";

  const menuName = currentMenuName.trim();
  if (!menuName) {
    historyDiv.innerHTML = "請先選擇菜單。";
    return;
  }

  if (currentOrderRef) {
    currentOrderRef.off(); // 移除舊的監聽
  }

  const orderRef = db.ref("orders/" + menuName);
  currentOrderRef = orderRef;

  // 🔔 綁定 child_changed 音效監聽（僅一次）
  setupStatusChangeListener(orderRef);

  orderRef.on("value", snapshot => {
    if (!snapshot.exists()) {
      historyDiv.innerHTML = "目前沒有任何訂單。";
      return;
    }

    const orders = [];
    snapshot.forEach(child => {
      const orderData = child.val();
      orders.push({ key: child.key, ...orderData });
    });

    // 按時間排序 & 過濾今天的訂單
    orders.sort((a, b) => new Date(b.time) - new Date(a.time));

    const now = new Date();
    const todayOrders = orders.filter(order => {
      const orderTime = new Date(order.time);
      return now.toDateString() === orderTime.toDateString();
    });

    historyDiv.innerHTML = todayOrders.map(order => {
      const timeObj = new Date(order.time);
      const formattedTime = timeObj.toLocaleDateString('zh-TW') + " " +
                            timeObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

      const statusText = order.status === "completed" ? "✅ 已完成"
                        : order.status === "cancelled" ? "❌ 已取消"
                        : order.status === "cooking" ? "🍳 製作中"
                        : "🟢 待處理";

      let cardBgColor = "#f9f9f9";
      if (order.status === "completed") cardBgColor = "#e0f7e9";
      else if (order.status === "cancelled") cardBgColor = "#ffe0e0";
      else if (order.status === "cooking") cardBgColor = "#fff3e0";

      const itemList = order.items.map(item => {
        const noteLine = item.note ? `<div style="font-size: 0.9em; color: #555;">備註：${item.note}</div>` : "";
        return `<li>${item.name} - $${item.price}${noteLine}</li>`;
      }).join("");

      const total = order.items.reduce((sum, item) => sum + (item.price || 0), 0);

      let actionButton = "";
      if (order.status === "cancelled") {
        actionButton = `<button onclick="loadCancelledOrderToCart('${encodeURIComponent(JSON.stringify(order.items))}')" style="margin-top:10px;">重新修改並送出</button>`;
      }

      return `
        <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:8px; background:${cardBgColor};">
          <strong>時間：</strong> ${formattedTime}<br>
          <strong>狀態：</strong> ${statusText}<br>
          <strong>總金額：</strong> $${total}<br>
          <strong>餐點：</strong>
          <ul>${itemList}</ul>
          ${actionButton}
        </div>
      `;
    }).join("");

    hasInitialRender = true; // 首次渲染完成
  });
}


// 🔔 專門綁定狀態變更監聽（只綁一次 per menu）
function setupStatusChangeListener(orderRef) {
  orderRef.on("child_changed", snapshot => {
    const order = snapshot.val();
    const orderId = snapshot.key;

    if (!hasInitialRender) return; // 初始渲染中不做事

    if (order.status === "completed") {
      playCompletionSound();
    }
  });
}

// 🔥 把取消的訂單項目重新載入到點餐車
function loadCancelledOrderToCart(encodedItems) {
  try {
    const items = JSON.parse(decodeURIComponent(encodedItems));
    if (!Array.isArray(items)) return;

    if (!confirm("將清空目前點餐車，重新載入這筆訂單，確定嗎？")) return;

    order = []; // 清空原本的點餐車
    items.forEach(item => {
      order.push({ name: item.name, price: item.price });
    });
    renderOrder();
    alert("✅ 已載入取消的訂單，可以修改後重新送出！");
  } catch (error) {
    console.error("載入取消訂單失敗：", error);
    alert("❌ 無法載入取消的訂單，請稍後再試。");
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
  updateCurrentMenuName(savedMenuName);
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

  items.forEach((item, index) => {
    const cat = categories.find(c => c.name === item.category);
    const textColor = cat?.textColor || "#ffffff";
    const card = document.createElement("div");
    card.className = "menu-item";
    card.style.backgroundColor = cat?.color || "#999";
    card.style.color = textColor;

    card.innerHTML = `
      <div style="font-size: 20px;">${item.name}</div>
      <div style="font-weight: normal;">${item.category}</div>
      <div>一般 $${item.price} <button onclick="addToOrder('${item.name}', ${item.price}, ${index}, '一般')">選</button></div>
      ${item.largePrice != null
        ? `<div>大份 $${item.largePrice} <button onclick="addToOrder('${item.name}（大份）', ${item.largePrice}, ${index}, '大份')">選</button></div>`
        : `<div style="height: 1.8em;"></div>`}
      <div>
        備註：<input type="text" id="note-${index}" placeholder="例如：不要◯◯" style="width: 95%; margin-top: 4px; box-sizing: border-box;" />
      </div>
    `;

    menu.appendChild(card);
  });
}


function addToOrder(name, price, index, portion = "") {
  const noteInput = document.getElementById(`note-${index}`);
  const note = noteInput ? noteInput.value.trim() : "";

  order.push({ name, price, note, portion });
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

    let itemHTML = `<div><strong>${item.name}</strong> - $${item.price}</div>`;
    if (item.note) {
      itemHTML += `<div style="font-size: 0.9em; color: #555;">備註：${item.note}</div>`;
    }

    const li = document.createElement("li");
    li.innerHTML = `
      ${itemHTML}
      <button class="edit-note-btn" onclick="editNote(${index})">✏️ 編輯備註</button>
      <button class="delete-btn" onclick="removeOrderItem(${index})">🗑️</button>
    `;

    list.appendChild(li);
  });

  totalLabel.textContent = "總金額：$" + total;
}

function removeOrderItem(index) {
  order.splice(index, 1);
  renderOrder();
}

function editNote(index) {
  const currentNote = order[index].note || "";
  const newNote = prompt("請輸入新的備註：", currentNote);
  if (newNote !== null) {
    order[index].note = newNote;
    renderOrder();
  }
}


function submitOrder() {
  if (!order.length) return alert("請先點餐");

  const menuName = currentMenuName.trim() || "default"; // ✅ 用 currentMenuName
  const orderPath = db.ref("orders/" + menuName);
  orderPath.push({ items: order, time: new Date().toISOString() });

  alert("訂單已送出");
  order = [];
  renderOrder();
  renderOrderHistory(); // ✅ 每次送出新訂單後刷新訂單紀錄
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

  const ref = menuRef.child(name);

  menuRef.once("value", snapshot => {
    const data = snapshot.val();

    if (data) {
      // 已存在的菜單，要求輸入密碼驗證
      const inputPassword = prompt("這是已存在的菜單，請輸入密碼以儲存修改：");
      if (!inputPassword) {
        showStatusMessage("❌ 已取消儲存");
        return;
      }
      if (inputPassword !== data.password) {
        showStatusMessage("❌ 密碼錯誤，無法儲存");
        return;
      }
      // 密碼正確，允許儲存
      menuRef.set({ categories, menuItems, password: data.password }, (error) => {
        if (error) {
          showStatusMessage("❌ 儲存失敗");
          console.error(error);
        } else {
          showStatusMessage("✅ 已儲存並載入菜單：" + name);
          renderSavedMenus();
          setTimeout(() => {
            const select = document.getElementById("savedMenus");
            if (select) select.value = name;
            currentMenuName = name;
            loadMenu(name);
          }, 100);
        }
      });

    } else {
      // 新菜單，要求設定新密碼
      const newPassword = prompt("這是新菜單，請設定一組密碼保護：");
      if (!newPassword) {
        showStatusMessage("❌ 未設定密碼，已取消儲存");
        return;
      }
      menuRef.set({ categories, menuItems, password: newPassword }, (error) => {
        if (error) {
          showStatusMessage("❌ 儲存失敗");
          console.error(error);
        } else {
          showStatusMessage("✅ 已儲存並載入菜單：" + name);
          renderSavedMenus();
          setTimeout(() => {
            const select = document.getElementById("savedMenus");
            if (select) select.value = name;
            currentMenuName = name;
            loadMenu(name);
          }, 100);
        }
      });
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
  currentMenuName = name; // 🔥 這行是新的，放在最前面，記住現在是哪個菜單
  savedMenuName = name; // ✅ 補這一行，讓 renderMenu() 能顯示正確名稱
  localStorage.setItem('currentMenuName', name); // 🔥 存到 localStorage
  db.ref("menus/" + name).once("value", snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      categories = data.categories || [];
      menuItems = data.menuItems || [];

      if (typeof renderCategoryList === "function") renderCategoryList();
      if (typeof renderCategoryOptions === "function") renderCategoryOptions();
      if (typeof renderMenu === "function") renderMenu();
      if (typeof renderMenuList === "function") renderMenuList();
      if (typeof renderOrderHistory === "function") renderOrderHistory(); // 🔥 新增這行！
      if (typeof callback === "function") callback(); // ✅ 手機版會用這個補 renderMenu
    }
  });
}

function deleteMenu() {
  const select = document.getElementById("savedMenus");
  const name = select?.value;
  if (!name) return alert("請選擇要刪除的菜單");

  db.ref("menus/" + name).once("value", snapshot => {
    const data = snapshot.val();
    if (!data) return alert("找不到該菜單資料");

    const inputPassword = prompt("請輸入密碼以刪除菜單：" + name);
    if (!inputPassword) return alert("已取消刪除");

    if (inputPassword !== data.password) {
      return alert("❌ 密碼錯誤，無法刪除");
    }

    // 密碼正確，確認後刪除
    if (confirm("確定要刪除菜單：" + name + "？")) {
      db.ref("menus/" + name).remove();
      alert("✅ 已刪除菜單：" + name);
      renderSavedMenus();
    }
  });
}


// 預設切換到點餐模式
switchMode("order");



function scrollToOrderHistory() {
  const historySection = document.getElementById("orderHistory");
  if (historySection) {
    historySection.scrollIntoView({ behavior: "smooth" });
  }
}

function saveCurrentMenu() {
  const select = document.getElementById("savedMenus");
  const menuName = select?.value;
  if (!menuName) return; // 沒選菜單就不做

  db.ref("menus/" + menuName).set({ categories, menuItems });
}



// ✅ 更新畫面上的目前菜單名稱
function updateCurrentMenuName(name) {
  const nameSpan = document.getElementById("menuNameText");
  if (nameSpan) {
    nameSpan.textContent = name || "（未選擇）";
  }
}

/* ==== 完成訂單音效 ==== */
window.addEventListener("DOMContentLoaded", () => {
  const completedSound = document.getElementById("completedSound");          // ← DOM 已就緒，一定取得到

  // 首次互動 → 解鎖
  function unlockCompletedSound() {
    completedSound.play()
      .then(() => {
        completedSound.pause();
        completedSound.currentTime = 0;
        console.log("🔊 completed.mp3 已解鎖");
      })
      .catch(() => {});   // iOS 靜音失敗時忽略
  }

  document.body.addEventListener("touchstart", unlockCompletedSound, { once:true });
  document.body.addEventListener("click",      unlockCompletedSound, { once:true });

  // 全域播放函式（供 child_changed 呼叫）
  window.playCompletionSound = () => {
    completedSound.currentTime = 0;
    completedSound.play().catch(()=>{});
  };
});
