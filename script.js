// GLOBAL DATA PORTAL CONFIGURATION
let shoeDatabase = [];
let locker = JSON.parse(localStorage.getItem('ghLocker')) || [];
let compareList = [];
let currentFilter = "ALL";

// FALLBACK IMAGES AND DATA FOR PROTECTION BLOCK IF API HAS CORRUPTED MEDIA LINKS
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80";

// LIVE STREAM CONNECTIVITY ENGINE
async function connectToLiveStream() {
    try {
        // Fetching live snapshot data from public sneaker database repository
        const response = await fetch('https://raw.githubusercontent.com/thesneakerdatabase/sneaker-database-data/master/sneakers.json');
        if (!response.ok) throw new Error("Stream connection failed");
        
        const rawData = await response.json();
        
        // Filter down to performance basketball and relevant brand profiles
        shoeDatabase = rawData.filter(item => 
            (item.category && item.category.toLowerCase() === "basketball") || 
            ["nike", "adidas", "puma", "jordan", "anta", "li-ning", "361"].includes(item.brand?.toLowerCase())
        ).map((item, index) => {
            // Determine tier categories dynamically
            let calculatedType = "SIGNATURE";
            const brandLower = item.brand?.toLowerCase() || "";
            if (!["nike", "jordan", "adidas"].includes(brandLower)) {
                calculatedType = "NICHE INTERNATIONAL";
            } else if (item.title?.toLowerCase().includes("academy") || item.title?.toLowerCase().includes("bounce")) {
                calculatedType = "BUDGET / TEAM";
            }

            return {
                id: index + 1,
                brand: (item.brand || "PERFORMANCE").toUpperCase(),
                line: item.collection || "HOOPS",
                name: item.title || "UNCATEGORIZED MODEL",
                price: item.retailPrice || 130,
                type: calculatedType,
                tech: "RESPONSIVE FOAM CORE + HIGH-TRACTION COMPOUNDS",
                date: item.releaseDate || "2026-04-15",
                img: item.media?.thumbUrl || item.media?.imageUrl || DEFAULT_IMAGE
            };
        });

        // Initialize user visual nodes
        initHero();
        updateActivePageData();
        
    } catch (error) {
        console.error("GLOBAL DATA STREAM INTERRUPTED:", error);
        document.getElementById('archive-grid').innerHTML = 
            `<div style="grid-column:1/-1; text-align:center; padding:100px 0; font-weight:900; color:var(--accent);">
                PIPELINE OFFLINE. SECURING ALTERNATE ROUTE...
             </div>`;
    }
}

function getSystemDateString() {
    return new Date().toISOString().split('T')[0];
}

function updateActivePageData() {
    if (document.getElementById('page-collection').classList.contains('active')) renderArchive();
    if (document.getElementById('page-calendar').classList.contains('active')) renderCalendar();
    if (document.getElementById('page-locker').classList.contains('active')) renderLocker();
}

// ROUTER SYSTEM
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    window.scrollTo(0,0);
    
    if(pageId === 'collection') { currentFilter = "ALL"; renderArchive(); }
    if(pageId === 'calendar') renderCalendar();
    if(pageId === 'locker') renderLocker();
}

// LAYOUT CARD ARCHITECTURE
function createCard(shoe) {
    const isFav = locker.includes(shoe.id);
    const isComp = compareList.includes(shoe.id);

    const card = document.createElement('div');
    card.className = 'shoe-card';
    card.onclick = () => openModal(shoe);
    card.innerHTML = `
        <div class="image-container">
            <button class="fav-btn ${isFav?'active':''}" onclick="toggleLocker(${shoe.id},event)">${isFav?'♥':'♡'}</button>
            <button class="comp-btn ${isComp?'active':''}" onclick="toggleCompare(${shoe.id},event)">VS</button>
            <img src="${shoe.img}" onerror="this.src='${DEFAULT_IMAGE}'" alt="Shoe Asset Image">
        </div>
        <p style="color:var(--accent); font-weight:900; font-size:0.6rem; margin-top:12px; letter-spacing:1px;">${shoe.brand} // ${shoe.type}</p>
        <div class="shoe-name" style="font-weight:900; font-size:0.85rem; line-height:1.2;">${shoe.name}</div>
    `;
    return card;
}

// RENDERING PORTALS
function renderArchive() {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    const query = document.getElementById('search-bar').value.toLowerCase();
    const todayStr = getSystemDateString();
    
    let controls = document.querySelector('.filter-subnav');
    if (!controls) {
        controls = document.createElement('div');
        controls.className = 'filter-subnav';
        controls.style.cssText = "padding: 15px 5%; display:flex; gap:10px; flex-wrap:wrap; background:var(--grey-light);";
        controls.innerHTML = `
            <button onclick="setArchiveFilter('ALL')" class="filter-tier-btn">ALL TIERS</button>
            <button onclick="setArchiveFilter('SIGNATURE')" class="filter-tier-btn">SIGNATURE DECK</button>
            <button onclick="setArchiveFilter('BUDGET / TEAM')" class="filter-tier-btn">TEAM & BUDGET</button>
            <button onclick="setArchiveFilter('NICHE INTERNATIONAL')" class="filter-tier-btn">NICHE & INT</button>
        `;
        document.getElementById('main-header').appendChild(controls);
    }

    grid.innerHTML = '';
    // Archive restriction logic: Items released today or in past timelines
    const dynamicArchiveDataset = shoeDatabase.filter(shoe => shoe.date <= todayStr);

    const filtered = dynamicArchiveDataset.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(query) || s.brand.toLowerCase().includes(query);
        const matchesCategory = (currentFilter === "ALL" || s.type === currentFilter);
        return matchesSearch && matchesCategory;
    });

    if(filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.5; font-weight:900;">NO MATCHES LOCATED IN CURRENT SNAPSHOT.</div>';
        return;
    }

    filtered.forEach(s => grid.appendChild(createCard(s)));
}

function setArchiveFilter(tier) {
    currentFilter = tier;
    renderArchive();
}

function renderCalendar() {
    const list = document.getElementById('calendar-list');
    if (!list) return;
    list.innerHTML = '';
    const todayStr = getSystemDateString();

    // Upcoming entries logic
    const upcomingDrops = shoeDatabase.filter(shoe => shoe.date > todayStr)
                                      .sort((a,b) => new Date(a.date) - new Date(b.date));
    
    if(upcomingDrops.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:100px 0; opacity:0.5; font-weight:900;">NO FUTURE TRACKED DROPS REGISTERED ON RAW PIPELINE STREAM.</div>';
        return;
    }

    upcomingDrops.slice(0, 20).forEach(shoe => {
        const item = document.createElement('div');
        item.className = 'calendar-item';
        item.innerHTML = `
            <div class="calendar-date">${shoe.date.split('-')[2] || "25"}<br><span style="font-size:0.7rem; color:var(--black)">MAY</span></div>
            <img src="${shoe.img}" width="150" onerror="this.src='${DEFAULT_IMAGE}'" style="max-height:100px; object-fit:contain;">
            <div>
                <span style="font-size:0.6rem; background:var(--black); color:white; padding:3px 6px; font-weight:900;">${shoe.type}</span>
                <div style="font-weight:900; font-size:1.2rem; margin-top:5px;">${shoe.name}</div>
                <div style="color:var(--accent); font-weight:900;">${shoe.brand} // MSRP: $${shoe.price}</div>
            </div>
            <button class="explore-btn" style="border-color:var(--black); color:var(--black); margin-left:auto;" onclick="openModalById(${shoe.id})">TECH SPECS</button>
        `;
        list.appendChild(item);
    });
}

function renderLocker() {
    const grid = document.getElementById('locker-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const saved = shoeDatabase.filter(s => locker.includes(s.id));
    saved.length ? saved.forEach(s => grid.appendChild(createCard(s))) : grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:100px 0; font-weight:900;">YOUR LOCKER IS CURRENTLY EMPTY.</div>';
}

function initHero() {
    if(shoeDatabase.length === 0) return;
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shoe = shoeDatabase[seed % shoeDatabase.length];
    
    document.getElementById('featured-hero').innerHTML = `
        <div class="hero-content">
            <div class="hero-text">
                <h3>GLOBAL DAILY SPOTLIGHT // LINE: ${shoe.brand}</h3>
                <h2>${shoe.name}</h2>
                <button class="explore-btn" onclick="showPage('collection')">EXPLORE ARCHIVE</button>
            </div>
            <div class="hero-img"><img src="${shoe.img}" onerror="this.src='${DEFAULT_IMAGE}'"></div>
        </div>
    `;
}

// MANAGEMENT SELECTION LOGIC
function toggleLocker(id, e) {
    e.stopPropagation();
    const idx = locker.indexOf(id);
    idx > -1 ? locker.splice(idx, 1) : locker.push(id);
    localStorage.setItem('ghLocker', JSON.stringify(locker));
    document.getElementById('locker-count').innerText = locker.length;
    updateActivePageData();
}

function toggleCompare(id, e) {
    e.stopPropagation();
    const idx = compareList.indexOf(id);
    if (idx > -1) compareList.splice(idx, 1);
    else if (compareList.length < 2) compareList.push(id);
    updateCompareTray();
    updateActivePageData();
}

function updateCompareTray() {
    const tray = document.getElementById('compare-tray');
    const slots = document.getElementById('compare-slots');
    tray.classList.toggle('active', compareList.length > 0);
    slots.innerHTML = compareList.map(id => {
        const s = shoeDatabase.find(x => x.id === id);
        return `<div class="slot-img"><img src="${s?.img || DEFAULT_IMAGE}" onerror="this.src='${DEFAULT_IMAGE}'"></div>`;
    }).join('');
}

function openCompareModal() {
    if(compareList.length < 2) return;
    const [s1, s2] = compareList.map(id => shoeDatabase.find(x => x.id === id));
    if(!s1 || !s2) return;
    
    document.getElementById('compare-results').innerHTML = [s1, s2].map(s => `
        <div class="compare-col">
            <img src="${s.img}" onerror="this.src='${DEFAULT_IMAGE}'">
            <h2 style="font-size:1.5rem; font-weight:900; margin:20px 0 10px; line-height:1.2;">${s.name}</h2>
            <p style="border-top: 1px solid var(--border); padding-top:15px;"><strong>LINEAGE:</strong> ${s.brand} // (${s.type})</p>
            <p style="border-top: 1px solid var(--border); padding-top:15px;"><strong>FOAM CUSHIONING:</strong> ${s.tech}</p>
            <p style="border-top: 1px solid var(--border); padding-top:15px; font-size:1.3rem; font-weight:900; color:var(--accent);">MSRP: $${s.price}</p>
        </div>
    `).join('');
    document.getElementById('compare-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openModal(shoe) {
    document.getElementById('modal-body').innerHTML = `
        <div style="background:var(--grey-light); padding:20px; border-radius:4px; display:flex; align-items:center; justify-content:center;">
            <img src="${shoe.img}" style="width:100%; max-width:350px; max-height:250px; object-fit:contain;" onerror="this.src='${DEFAULT_IMAGE}'">
        </div>
        <div>
            <p style="color:var(--accent); font-weight:900; letter-spacing:2px; margin:0;">${shoe.brand} // [${shoe.type}]</p>
            <h2 style="font-size: clamp(1.8rem, 4vw, 3rem); margin:10px 0; letter-spacing:-1px; line-height:1; font-weight:900;">${shoe.name}</h2>
            
            <div style="margin:25px 0; padding:20px; border-left:4px solid var(--accent); background:var(--grey-light);">
                <h4 style="margin:0 0 10px 0; font-weight:900;">ENGINEERING SPECIFICATIONS</h4>
                <p style="text-transform:none; color:var(--black); opacity:0.8; line-height:1.6; margin:0;">
                    Constructed for competitive basketball requirements. Implements <strong>${shoe.tech}</strong> systems targeted for optimal traction, energy deflection, and lateral containment.
                </p>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px;">
                <div>
                    <small style="opacity:0.6; font-weight:900; font-size:0.7rem;">SCOUTING STATUS / VAL DATE</small>
                    <div style="font-weight:900; font-size:1.2rem; margin-top:4px;">${shoe.date}</div>
                </div>
                <div>
                    <small style="opacity:0.6; font-weight:900; font-size:0.7rem;">BASE RETAIL MSRP</small>
                    <div style="font-weight:900; font-size:1.2rem; margin-top:4px; color:var(--accent);">$${shoe.price}</div>
                </div>
            </div>

            <button class="explore-btn" style="background:var(--black); color:var(--white); width:100%; border:none; padding:18px;" onclick="closeModal()">RETURN TO PORTAL</button>
        </div>
    `;
    document.getElementById('modal').style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function openModalById(id) { openModal(shoeDatabase.find(x => x.id === id)); }
function closeModal() { document.getElementById('modal').style.display = 'none'; document.body.style.overflow = 'auto'; }
function closeCompareModal() { document.getElementById('compare-modal').style.display = 'none'; document.body.style.overflow = 'auto'; }
function clearCompare() { compareList = []; updateCompareTray(); updateActivePageData(); }

document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-theme');
    document.getElementById('theme-toggle').innerText = document.body.classList.contains('dark-theme') ? 'LIGHT' : 'DARK';
};

// INITIALIZATION PIPELINE BOOT
connectToLiveStream();
document.getElementById('locker-count').innerText = locker.length;
