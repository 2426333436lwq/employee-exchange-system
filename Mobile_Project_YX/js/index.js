let carouselIndex = 0;
let carouselTimer = null;
let currentReviewProductId = 0;
let currentReviewRatingFilter = 0;

document.addEventListener('DOMContentLoaded', function() {
    initPage();
});

function initPage() {
    updateUserPointsDisplay();
    updateStatsDisplay();
    initCarousel();
    renderHotProducts();
    renderMallProducts();
    renderOrders();
    renderPointsHistory();
    initCategoryFilter();
    initPointsFilter();
    initOrderFilter();
    initPointsHistoryFilter();
}

function handleSearch(event) {
    if (event.key === 'Enter') {
        const keyword = event.target.value.trim();
        const searchResults = mockData.products.filter(p => 
            p.name.toLowerCase().includes(keyword.toLowerCase())
        );
        const container = document.getElementById('mall-products');
        if (searchResults.length > 0) {
            container.innerHTML = searchResults.map(product => createProductCard(product)).join('');
        } else {
            container.innerHTML = '<div class="text-center text-text-light py-8">未找到相关商品</div>';
        }
    }
}

function updateUserPointsDisplay() {
    const elPointsIndex = document.getElementById('user-points-index');
    const elCurrentPoints = document.getElementById('current-points');
    const elTotalEarned = document.getElementById('total-earned');
    const elTotalSpent = document.getElementById('total-spent');
    
    if (elPointsIndex) elPointsIndex.textContent = mockData.user.points;
    if (elCurrentPoints) elCurrentPoints.textContent = mockData.user.points;
    if (elTotalEarned) elTotalEarned.textContent = getTotalEarned();
    if (elTotalSpent) elTotalSpent.textContent = getTotalSpent();
}

function updateStatsDisplay() {
    const elOnline = document.getElementById('online-products');
    const elPending = document.getElementById('pending-orders');
    const elChanges = document.getElementById('today-changes');
    
    if (elOnline) elOnline.textContent = getOnlineProductCount();
    if (elPending) elPending.textContent = getPendingOrderCount();
    if (elChanges) elChanges.textContent = getTodayPointsChanges();
    updateOrderStats();
}

function updateOrderStats() {
    const orders = mockData.orders;
    const allCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const shippedCount = orders.filter(o => o.status === 'shipped').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;
    
    const elAll = document.getElementById('order-count-all');
    const elPending = document.getElementById('order-count-pending');
    const elShipped = document.getElementById('order-count-shipped');
    const elCompleted = document.getElementById('order-count-completed');
    const elTotalExchanged = document.getElementById('total-exchanged');
    
    if (elAll) elAll.textContent = allCount;
    if (elTotalExchanged) elTotalExchanged.textContent = completedCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elShipped) elShipped.textContent = shippedCount;
    if (elCompleted) elCompleted.textContent = completedCount;
}

function initCarousel() {
    renderBannerSlides();
    
    document.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            carouselIndex = index;
            updateCarousel();
        });
    });
    
    carouselTimer = setInterval(() => {
        carouselIndex = (carouselIndex + 1) % mockData.banners.length;
        updateCarousel();
    }, 3000);
}

function renderBannerSlides() {
    const carouselInner = document.getElementById('carousel-inner');
    const carouselIndicators = document.getElementById('carousel-indicators');
    
    carouselInner.innerHTML = mockData.banners.map((banner, index) => `
        <div class="carousel-item cursor-pointer" style="background: linear-gradient(135deg, ${getBannerColor(index)} 0%, ${getBannerColorLight(index)} 100%);" onclick="openBannerPage('${banner.target}')">
            <div class="text-center">
                <div class="text-2xl font-bold mb-2">${banner.title}</div>
                <div class="text-sm opacity-90">点击查看详情</div>
            </div>
        </div>
    `).join('');
    
    carouselIndicators.innerHTML = mockData.banners.map((_, index) => `
        <div class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');
}

function openBannerPage(bannerId) {
    switch(bannerId) {
        case 'banner-year-end':
            switchPage('banner-year-end');
            break;
        case 'banner-points-double':
            switchPage('banner-points-double');
            break;
        case 'banner-new-user':
            switchPage('banner-new-user');
            break;
    }
}

function getBannerColor(index) {
    const colors = ['#FF6B6B', '#4A7CFF', '#34C759'];
    return colors[index % colors.length];
}

function getBannerColorLight(index) {
    const colors = ['#FF8E8E', '#6B8FFF', '#4CD964'];
    return colors[index % colors.length];
}

function updateCarousel() {
    const inner = document.getElementById('carousel-inner');
    inner.style.transform = `translateX(-${carouselIndex * 100}%)`;
    
    document.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
        indicator.classList.toggle('active', index === carouselIndex);
    });
}

function renderHotProducts() {
    const container = document.getElementById('hot-products');
    const hotProducts = mockData.products.filter(p => p.isTop === true);
    container.innerHTML = hotProducts.map(product => createProductCard(product)).join('');
}

function renderMallProducts(filterCategory = 0, filterPoints = 0) {
    const container = document.getElementById('mall-products');
    let products = [...mockData.products];
    
    if (filterCategory === 1) {
        products = products.filter(p => p.isTop === true);
    } else if (filterCategory > 1) {
        products = products.filter(p => p.categoryId === filterCategory);
    }
    
    if (filterPoints > 0) {
        if (filterPoints === 1) products = products.filter(p => p.points <= 500);
        else if (filterPoints === 2) products = products.filter(p => p.points > 500 && p.points <= 1000);
        else if (filterPoints === 3) products = products.filter(p => p.points > 1000 && p.points <= 2000);
        else if (filterPoints === 4) products = products.filter(p => p.points > 2000);
    }
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center py-10 text-text-light">
                <i class="ri-inbox-line text-5xl mb-3 block"></i>
                <p>暂无相关商品</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const isFav = isFavorite(product.id);
    return `
        <div class="product-card cursor-pointer" onclick="viewProduct(${product.id})">
            <div class="relative">
                <img src="${product.image}" class="product-image" alt="${product.name}" onerror="this.src='https://picsum.photos/seed/${product.id}/200/140'">
                <button class="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow" onclick="event.stopPropagation(); toggleProductFavorite(${product.id}, this)">
                    <i class="${isFav ? 'ri-heart-fill text-red-500' : 'ri-heart-line text-gray-400'} text-lg"></i>
                </button>
            </div>
            <div class="product-info">
                <div class="text-sm text-text-dark line-clamp-2 mb-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 40px;">${product.name}</div>
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <span class="text-accent font-bold">${product.points}</span>
                        <span class="text-text-light text-xs">积分</span>
                    </div>
                    <div class="text-text-light text-xs">库存${product.stock}</div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-text-light text-xs">月售${product.monthlySales}</div>
                    <button class="px-3 py-1 bg-primary text-white text-xs rounded-full" onclick="event.stopPropagation(); showExchangeConfirm(${product.id})">立即兑换</button>
                </div>
            </div>
        </div>
    `;
}

function initCategoryFilter() {
    const categoryTags = document.querySelectorAll('.category-tag');
    
    categoryTags.forEach(tag => {
        tag.addEventListener('click', function() {
            categoryTags.forEach(t => {
                t.classList.remove('tag-active');
                t.classList.add('bg-white');
            });
            this.classList.add('tag-active');
            this.classList.remove('bg-white');
            
            const category = parseInt(this.dataset.category);
            const pointsTag = document.querySelector('.points-tag.tag-active');
            const points = parseInt(pointsTag.dataset.points);
            document.getElementById('search-input').value = '';
            renderMallProducts(category, points);
        });
    });
}

function initPointsFilter() {
    const pointsTags = document.querySelectorAll('.points-tag');
    
    pointsTags.forEach(tag => {
        tag.addEventListener('click', function() {
            pointsTags.forEach(t => {
                t.classList.remove('tag-active');
                t.classList.add('bg-white');
            });
            this.classList.add('tag-active');
            this.classList.remove('bg-white');
            
            const points = parseInt(this.dataset.points);
            const categoryTag = document.querySelector('.category-tag.tag-active');
            const category = parseInt(categoryTag.dataset.category);
            renderMallProducts(category, points);
        });
    });
}

function viewProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;
    
    currentProduct = product;
    
    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-points').textContent = product.points;
    document.getElementById('product-stock').textContent = product.stock;
    document.getElementById('product-brand').textContent = product.brand || '-';
    document.getElementById('product-sales').textContent = product.monthlySales;
    document.getElementById('product-rating').textContent = product.rating;
    document.getElementById('product-desc').textContent = product.description || '';
    document.getElementById('detail-points').textContent = product.points;
    
    updateProductFavoriteBtn(productId);
    
    const categoryTag = document.getElementById('product-category-tag');
    const typeTag = document.getElementById('product-type-tag');
    const extraInfo = document.getElementById('product-extrainfo');
    
    categoryTag.textContent = product.categoryName || '全部';
    
    const specsTitle = document.getElementById('specs-title');
    const specsContainer = document.getElementById('product-specs');
    
    if (product.type === 'physical') {
        typeTag.textContent = '实物';
        extraInfo.textContent = `月销 ${product.monthlySales} 件`;
        specsTitle.textContent = '规格参数';
        
        let specsHtml = '';
        if (product.specs) {
            Object.entries(product.specs).forEach(([key, value]) => {
                specsHtml += `<div class="flex"><span class="text-text-light w-24">${key}</span><span class="text-text-dark flex-1">${value}</span></div>`;
            });
        }
        specsContainer.innerHTML = specsHtml;
        
    } else if (product.type === 'virtual') {
        typeTag.textContent = '虚拟';
        extraInfo.textContent = `虚拟可兑换名额 ${product.stock} 个 | 有效期：${product.validity || '永久有效'}`;
        specsTitle.textContent = '使用规则';
        
        let specsHtml = '';
        if (product.specs) {
            Object.entries(product.specs).forEach(([key, value]) => {
                specsHtml += `<div class="flex"><span class="text-text-light w-24">${key}</span><span class="text-text-dark flex-1">${value}</span></div>`;
            });
        }
        if (product.accountSpeed) {
            specsHtml += `<div class="flex"><span class="text-text-light w-24">到账时效</span><span class="text-text-dark flex-1">${product.accountSpeed}</span></div>`;
        }
        specsContainer.innerHTML = specsHtml;
        
    } else if (product.type === 'service') {
        typeTag.textContent = '服务';
        extraInfo.textContent = `可预约名额 ${product.stock} 个 | 服务商：${product.serviceProvider || '-'}`;
        specsTitle.textContent = '服务须知';
        
        let specsHtml = '';
        if (product.serviceArea) {
            specsHtml += `<div class="flex"><span class="text-text-light w-24">适用门店</span><span class="text-text-dark flex-1">${product.serviceArea}</span></div>`;
        }
        if (product.serviceValidity) {
            specsHtml += `<div class="flex"><span class="text-text-light w-24">有效期</span><span class="text-text-dark flex-1">${product.serviceValidity}</span></div>`;
        }
        if (product.specs) {
            Object.entries(product.specs).forEach(([key, value]) => {
                specsHtml += `<div class="flex"><span class="text-text-light w-24">${key}</span><span class="text-text-dark flex-1">${value}</span></div>`;
            });
        }
        specsContainer.innerHTML = specsHtml;
    }
    
    const reviewCount = document.getElementById('product-review-count');
    const productReviews = mockData.reviews.filter(r => r.productId === productId);
    reviewCount.textContent = productReviews.length > 0 ? `查看${productReviews.length}条评价` : '暂无评价';
    
    switchPage('product');
}

function viewProductReviews(productId) {
    currentReviewProductId = productId;
    currentReviewRatingFilter = 0;
    
    const product = getProductById(productId);
    if (!product) return;
    
    document.getElementById('review-product-image').src = product.image;
    document.getElementById('review-product-name').textContent = product.name;
    document.getElementById('review-product-points').textContent = product.points;
    
    const productReviews = mockData.reviews.filter(r => r.productId === productId);
    const totalCount = productReviews.length;
    const avgRating = totalCount > 0 ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1) : '0';
    
    document.getElementById('review-avg-rating').textContent = avgRating;
    document.getElementById('review-total-count').textContent = totalCount;
    
    const ratingCounts = [0, 0, 0, 0, 0, 0];
    productReviews.forEach(r => ratingCounts[r.rating]++);
    
    const tagsHtml = `
        <span class="px-3 py-1 bg-primary text-white text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(0)">全部(${totalCount})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 5 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(5)">5星(${ratingCounts[5]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 4 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(4)">4星(${ratingCounts[4]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 3 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(3)">3星(${ratingCounts[3]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 2 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(2)">2星(${ratingCounts[2]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 1 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(1)">1星(${ratingCounts[1]})</span>
    `;
    document.getElementById('review-rating-tags').innerHTML = tagsHtml;
    
    renderReviewsList(productReviews);
    
    switchPage('reviews');
}

function filterReviewsByRating(rating) {
    currentReviewRatingFilter = rating;
    
    const productReviews = mockData.reviews.filter(r => r.productId === currentReviewProductId);
    let filteredReviews = productReviews;
    
    if (rating > 0) {
        filteredReviews = productReviews.filter(r => r.rating === rating);
    }
    
    const ratingCounts = [0, 0, 0, 0, 0, 0];
    productReviews.forEach(r => ratingCounts[r.rating]++);
    const totalCount = productReviews.length;
    
    const tagsHtml = `
        <span class="px-3 py-1 ${currentReviewRatingFilter === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(0)">全部(${totalCount})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 5 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(5)">5星(${ratingCounts[5]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 4 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(4)">4星(${ratingCounts[4]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 3 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(3)">3星(${ratingCounts[3]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 2 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(2)">2星(${ratingCounts[2]})</span>
        <span class="px-3 py-1 ${currentReviewRatingFilter === 1 ? 'bg-primary text-white' : 'bg-gray-100 text-text-medium'} text-xs rounded-full cursor-pointer" onclick="filterReviewsByRating(1)">1星(${ratingCounts[1]})</span>
    `;
    document.getElementById('review-rating-tags').innerHTML = tagsHtml;
    
    renderReviewsList(filteredReviews);
}

function renderReviewsList(reviews) {
    const container = document.getElementById('reviews-list');
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-text-light">
                <i class="ri-chat-delete-line text-5xl mb-3 block"></i>
                <p>暂无评价</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div class="card">
            <div class="flex items-start gap-3">
                <img src="${review.userAvatar}" class="w-10 h-10 rounded-full bg-gray-100" alt="">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-medium text-text-dark">${review.userName}</span>
                        <span class="text-xs text-text-light">${review.time}</span>
                    </div>
                    <div class="flex items-center gap-1 mb-2">
                        ${Array(5).fill(0).map((_, i) => `<i class="ri-star-fill text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}"></i>`).join('')}
                    </div>
                    <p class="text-sm text-text-medium leading-relaxed">${review.content}</p>
                    ${review.images && review.images.length > 0 ? `
                        <div class="flex gap-2 mt-2">
                            ${review.images.map(img => `<img src="${img}" class="w-16 h-16 rounded-lg object-cover" alt="">`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderOrders(filterStatus = 'all') {
    const container = document.getElementById('orders-list');
    let orders = getOrdersByStatus(filterStatus);
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-text-light">
                <i class="ri-inbox-line text-5xl mb-3 block"></i>
                <p>暂无订单记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card cursor-pointer" onclick="viewOrderDetail('${order.id}')">
            <div class="flex items-center justify-between mb-3">
                <div class="text-xs text-text-light">订单号: ${order.id}</div>
                <div class="text-sm ${getStatusClass(order.status)}">${order.statusLabel}</div>
            </div>
            <div class="flex items-center gap-3">
                <img src="${order.productImage}" class="w-16 h-16 rounded-lg object-cover" alt="${order.productName}" onerror="this.src='https://picsum.photos/seed/${order.productId}/64/64'">
                <div class="flex-1">
                    <div class="text-sm text-text-dark">${order.productName}</div>
                    <div class="flex items-center justify-between mt-2">
                        <div>
                            <span class="text-accent font-semibold">${order.points}</span>
                            <span class="text-text-light text-xs">积分</span>
                        </div>
                        <div class="text-xs text-text-light">${order.exchangeTime}</div>
                    </div>
                </div>
            </div>
            ${order.status === 'pending' ? `
                <div class="flex justify-end mt-3 pt-3 border-t border-gray-100" onclick="event.stopPropagation()">
                    <button class="px-4 py-1 border border-accent text-accent text-sm rounded-full" onclick="showCancelOrderModal('${order.id}')">
                        取消订单
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStatusClass(status) {
    const classes = {
        'pending': 'text-accent',
        'shipped': 'text-primary',
        'completed': 'text-green-500',
        'cancelled': 'text-gray-400'
    };
    return classes[status] || 'text-text-light';
}

function viewOrderDetail(orderId) {
    const order = mockData.orders.find(o => o.id === orderId);
    if (!order) return;
    
    document.getElementById('detail-order-id').textContent = order.id;
    document.getElementById('detail-order-status').textContent = order.statusLabel;
    document.getElementById('detail-order-status').className = `text-sm font-medium ${getStatusClass(order.status)}`;
    document.getElementById('detail-order-product-image').src = order.productImage;
    document.getElementById('detail-order-product-name').textContent = order.productName;
    document.getElementById('detail-order-points').textContent = order.points;
    document.getElementById('detail-order-exchange-time').textContent = order.exchangeTime;
    
    let extraInfoHtml = '';
    if (order.status === 'cancelled') {
        extraInfoHtml = `
            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                <span class="text-text-light">取消时间</span>
                <span class="text-text-dark">${order.cancelTime || '-'}</span>
            </div>
            <div class="flex justify-between text-sm mt-2">
                <span class="text-text-light">取消原因</span>
                <span class="text-text-dark">${order.cancelReason || '-'}</span>
            </div>
        `;
    } else if (order.status === 'shipped') {
        extraInfoHtml = `
            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                <span class="text-text-light">发货时间</span>
                <span class="text-text-dark">${order.shipTime || order.exchangeTime}</span>
            </div>
            <div class="flex justify-between text-sm mt-2">
                <span class="text-text-light">物流信息</span>
                <span class="text-text-dark">${order.deliveryInfo || '顺丰速运 SF1234567890'}</span>
            </div>
        `;
    } else if (order.status === 'completed') {
        extraInfoHtml = `
            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                <span class="text-text-light">完成时间</span>
                <span class="text-text-dark">${order.completeTime || order.exchangeTime}</span>
            </div>
        `;
    }
    document.getElementById('detail-order-extra').innerHTML = extraInfoHtml;
    
    document.getElementById('order-detail-modal').classList.add('show');
}

function initOrderFilter() {
    const orderTags = document.querySelectorAll('.order-tag');
    
    orderTags.forEach(tag => {
        tag.addEventListener('click', function() {
            orderTags.forEach(t => {
                t.classList.remove('tag-active');
                t.classList.add('text-text-medium');
            });
            this.classList.add('tag-active');
            this.classList.remove('text-text-medium');
            
            const status = this.dataset.status;
            renderOrders(status);
        });
    });
}

function renderPointsHistory(filterType = 'all') {
    const container = document.getElementById('points-history-list');
    let history = getPointsHistoryByType(filterType);
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-text-light">
                <i class="ri-file-list-line text-5xl mb-3 block"></i>
                <p>暂无积分记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.map(item => `
        <div class="card py-3">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm text-text-dark">${item.description}</div>
                    <div class="text-xs text-text-light mt-1">${item.time}</div>
                </div>
                <div class="${item.type === 'earn' ? 'text-green-500' : 'text-accent'} font-semibold">
                    ${item.type === 'earn' ? '+' : ''}${item.points}
                </div>
            </div>
        </div>
    `).join('');
}

function initPointsHistoryFilter() {
    const historyTags = document.querySelectorAll('.points-history-tag');
    
    historyTags.forEach(tag => {
        tag.addEventListener('click', function() {
            historyTags.forEach(t => {
                t.classList.remove('tag-active');
                t.classList.add('text-text-medium');
            });
            this.classList.add('tag-active');
            this.classList.remove('text-text-medium');
            
            const type = this.dataset.type;
            renderPointsHistory(type);
        });
    });
}

function showExchangeModal() {
    document.getElementById('exchange-modal').classList.add('show');
}

function showExchangeConfirm(productId) {
    const product = mockData.products.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    const userPoints = mockData.user.points;
    const productPoints = product.points;
    const remainingPoints = userPoints - productPoints;
    
    document.getElementById('exchange-product-image').src = product.image;
    document.getElementById('exchange-product-name').textContent = product.name;
    document.getElementById('exchange-product-points').textContent = productPoints;
    document.getElementById('exchange-user-points').textContent = userPoints;
    document.getElementById('exchange-product-points-deduct').textContent = productPoints;
    document.getElementById('exchange-remaining-points').textContent = remainingPoints;
    
    const canExchange = userPoints >= productPoints;
    const confirmBtn = document.getElementById('exchange-confirm-btn');
    if (canExchange) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '确认兑换';
        confirmBtn.className = 'flex-1 py-2 bg-primary text-white rounded-lg';
    } else {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '积分不足';
        confirmBtn.className = 'flex-1 py-2 bg-gray-300 text-gray-500 rounded-lg';
    }
    
    document.getElementById('exchange-modal').classList.add('show');
}

function showCancelOrderModal(orderId) {
    currentOrderId = orderId;
    document.getElementById('cancel-order-modal').classList.add('show');
}

function confirmExchange() {
    closeModal('exchange-modal');
    
    updateUserPoints(-currentProduct.points);
    
    const newOrder = {
        id: 'ORD' + Date.now(),
        productId: currentProduct.id,
        productName: currentProduct.name,
        productImage: currentProduct.image,
        points: currentProduct.points,
        status: 'pending',
        exchangeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        statusLabel: '待处理'
    };
    addOrder(newOrder);
    
    addPointsRecord({
        id: Date.now(),
        type: 'spend',
        points: -currentProduct.points,
        description: `兑换${currentProduct.name}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    updateUserPointsDisplay();
    updateStatsDisplay();
    
    showToast('兑换成功！');
    
    setTimeout(() => {
        switchPage('orders');
        renderOrders();
    }, 1000);
}

function confirmCancelOrder() {
    closeModal('cancel-order-modal');
    
    const order = mockData.orders.find(o => o.id === currentOrderId);
    if (order) {
        updateUserPoints(order.points);
        
        order.status = 'cancelled';
        order.statusLabel = '已取消';
        
        addPointsRecord({
            id: Date.now(),
            type: 'earn',
            points: order.points,
            description: `订单取消返还积分`,
            time: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
        
        updateUserPointsDisplay();
        updateStatsDisplay();
    }
    
    showToast('订单已取消');
    renderOrders();
}

function updateProductFavoriteBtn(productId) {
    const isFav = isFavorite(productId);
    const navBtn = document.getElementById('product-favorite-btn');
    const detailBtn = document.getElementById('detail-favorite-btn');
    
    if (navBtn) {
        const navIcon = navBtn.querySelector('i');
        if (isFav) {
            navIcon.className = 'ri-heart-fill text-xl text-red-500';
        } else {
            navIcon.className = 'ri-heart-line text-xl text-gray-400';
        }
    }
    
    if (detailBtn) {
        const detailIcon = detailBtn.querySelector('i');
        const detailText = detailBtn.querySelector('span');
        if (isFav) {
            detailIcon.className = 'ri-heart-fill';
            detailText.textContent = '已收藏';
            detailBtn.className = 'flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-500 font-medium rounded-full';
        } else {
            detailIcon.className = 'ri-heart-line';
            detailText.textContent = '收藏';
            detailBtn.className = 'flex items-center gap-2 px-4 py-2.5 border border-primary text-primary font-medium rounded-full';
        }
    }
}

function toggleProductFavorite(productId, btnElement) {
    const isFav = toggleFavorite(productId);
    const icon = btnElement.querySelector('i');
    
    if (isFav) {
        icon.className = 'ri-heart-fill text-red-500 text-lg';
        showToast('已添加到收藏');
    } else {
        icon.className = 'ri-heart-line text-gray-400 text-lg';
        showToast('已取消收藏');
    }
}

function toggleDetailFavorite() {
    if (!currentProduct) return;
    
    const isFav = toggleFavorite(currentProduct.id);
    updateProductFavoriteBtn(currentProduct.id);
    
    if (isFav) {
        showToast('已添加到收藏');
    } else {
        showToast('已取消收藏');
    }
}

function renderFavorites() {
    const favorites = getFavorites();
    const container = document.getElementById('favorites-container');
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16">
                <i class="ri-heart-line text-6xl text-gray-300 mb-4"></i>
                <p class="text-text-light">暂无收藏商品</p>
                <p class="text-text-light text-sm mt-2">快去商城挑选心仪的商品吧</p>
                <button class="mt-4 px-6 py-2 btn-primary rounded-full text-sm" onclick="switchPage('mall')">
                    去商城看看
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="product-grid">
                ${favorites.map(product => createProductCard(product)).join('')}
            </div>
        `;
    }
}