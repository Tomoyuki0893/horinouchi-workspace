var isMenuIconReplaced = false;

function resizeContents_end() {
    if (isMenuIconReplaced) return;
    isMenuIconReplaced = true;

    var windowW = $(window).width();
    var targetW = Math.floor(windowW * 0.95);
    var blockW = Math.floor(targetW / 2);

    $('table.resultArea').css('width', targetW + 'px');
    $('#tdBox0, #tdBox1').css('width', blockW + 'px');
    $('#box1, #box2').css('width', blockW + 'px');
    $('#tdBox2').css('width', targetW + 'px');
    $('#box0').css('width', targetW + 'px');

    replaceBlockToGrid('tbl_L_data_1', '2', blockW);
    replaceBlockToGrid('tbl_L_data_2', '3', blockW);
}

function replaceBlockToGrid(tbodyId, prefix, blockW) {
    var $tbody = $('#' + tbodyId);
    if ($tbody.length === 0) return;

    var items = [];
    $tbody.find('tr').each(function () {
        var $row = $(this);
        var rowIndex = $row.data('row-key');
        var url = $row.find('input[name="' + prefix + '_LINK_URL_' + rowIndex + '"]').val();
        var name = $row.find('input[name="' + prefix + '_LINK_NAME_' + rowIndex + '"]').val();
        var iconSrc = $row.find('td[data-cell-seq="0"] img').attr('src');
        if (!url || !name) return;
        items.push({ url: url, name: name, iconSrc: iconSrc });
    });

    if (items.length === 0) return;

    // アイコン1個あたりの最小幅（これを基準に列数を決める）
    var gap = 8;
    var padding = 8;
    var iconMinW = 80;   // アイコン最小幅（px）
    var iconMaxW = 120;  // アイコン最大幅（px）
    var usableW = blockW - padding * 2;

    // 列数を動的に計算（最小3・最大6）
    var cols = Math.floor(usableW / (iconMinW + gap));
    cols = Math.max(3, Math.min(6, cols)); // 3〜6列に収める

    // 列数からアイコン幅を逆算
    var iconW = Math.floor((usableW - gap * (cols - 1)) / cols);
    iconW = Math.min(iconW, iconMaxW); // 最大幅を超えないよう制限

    var html = '<div style="display:flex; flex-wrap:wrap; gap:' + gap + 'px; padding:' + padding + 'px;">';
    for (var i = 0; i < items.length; i++) {
        html +=
            '<a href="' + items[i].url + '" target="_blank" ' +
            '   style="text-decoration:none; display:flex; flex-direction:column; align-items:center; ' +
            '          width:' + iconW + 'px; box-sizing:border-box; padding:4px;">' +
            '<img src="' + items[i].iconSrc + '" ' +
            '     style="width:60px; height:60px; object-fit:contain; display:block;">' +
            '<span style="font-size:11px; color:#1D3261; text-align:center; margin-top:4px; word-break:break-all;">' +
            items[i].name +
            '</span>' +
            '</a>';
    }
    html += '</div>';

    var $scrollBody = $tbody.closest('div[id^="tbl_scrollable_body"]');
    $scrollBody.html(html);
}