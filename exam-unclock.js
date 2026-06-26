// ==UserScript==
// @name         学习通考试发布 - 隐藏功能解锁面板
// @namespace    https://github.com/Tao-stu/chaoxing-exam-helper
// @version      1.0.0
// @description  浮窗面板 + 自动注入缺失的监考/防作弊HTML，解锁全部隐藏设置
// @author       @小夏不菜吖
// @match        *://*.chaoxing.com/*
// @match        *://*.edu.cn/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ==================== 浮窗面板样式 ====================
  const panelCSS = `
#cx-unlock-panel {
  position: fixed; top: 80px; right: 10px; z-index: 999999;
  width: 270px; background: #fff; border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18); font-size: 13px;
  font-family: "Microsoft YaHei",sans-serif; color: #333;
  user-select: none; transition: box-shadow 0.2s;
}
#cx-unlock-panel.dragging { box-shadow: 0 12px 40px rgba(0,0,0,0.28); }
#cx-unlock-panel.cx-collapsed .cx-panel-body { display: none; }
#cx-unlock-panel.cx-collapsed .cx-toggle-icon { transform: rotate(180deg); }
.cx-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: linear-gradient(135deg,#2563EB,#3B82F6);
  color: #fff; border-radius: 10px 10px 0 0; cursor: move;
}
.cx-panel-title { font-weight: 600; font-size: 14px; }
.cx-panel-actions { display: flex; gap: 4px; }
.cx-panel-actions button {
  background: rgba(255,255,255,0.2); border: none; color: #fff;
  width: 24px; height: 24px; border-radius: 5px; cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
}
.cx-panel-actions button:hover { background: rgba(255,255,255,0.35); }
.cx-toggle-icon { transition: transform 0.25s; display: inline-block; }
.cx-panel-body { max-height: 70vh; overflow-y: auto; padding: 8px 0; }
.cx-panel-body::-webkit-scrollbar { width: 5px; }
.cx-panel-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
.cx-section { border-bottom: 1px solid #f0f0f0; padding: 4px 12px 6px; }
.cx-section:last-child { border-bottom: none; }
.cx-section-title { font-size: 11px; color: #888; margin-bottom: 4px; letter-spacing: 1px; }
.cx-row { display: flex; align-items: center; padding: 3px 0; cursor: pointer; }
.cx-row:hover { background: #f8faff; border-radius: 4px; margin: 0 -4px; padding: 3px 4px; }
.cx-row input[type="checkbox"] {
  width: 15px; height: 15px; accent-color: #2563EB;
  margin: 0 8px 0 0; flex-shrink: 0; cursor: pointer;
}
.cx-row label { cursor: pointer; flex: 1; font-size: 12px; }
.cx-panel-footer {
  display: flex; gap: 6px; padding: 8px 12px; border-top: 1px solid #e8e8e8;
}
.cx-btn {
  flex: 1; padding: 7px 0; border: 1px solid #2563EB;
  border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
  transition: all 0.15s;
}
.cx-btn-primary { background: #2563EB; color: #fff; }
.cx-btn-primary:hover { background: #1D4ED8; }
.cx-btn-ghost { background: #fff; color: #2563EB; }
.cx-btn-ghost:hover { background: #eff6ff; }
.cx-btn-reset { background: #fff; color: #999; border-color: #ddd; flex: 0.6; }
.cx-btn-reset:hover { background: #f5f5f5; }
.cx-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: #1e293b; color: #fff; padding: 8px 20px; border-radius: 20px;
  font-size: 13px; z-index: 9999999; opacity: 0; transition: opacity 0.3s;
  pointer-events: none;
}
.cx-toast.show { opacity: 1; }
`;
  if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(panelCSS);
  } else {
    const style = document.createElement('style');
    style.textContent = panelCSS;
    document.head.appendChild(style);
  }

  // ==================== 动态注入监考HTML ====================
  function injectMonitoringHTML() {
    // 如果已经存在，直接返回
    if (document.querySelector('.examMonitorControl')) return true;

    // 找到插入位置：防作弊设置区域末尾，作答要求之前
    const antiCheatSection = document.querySelector('#switchScreenControl')?.closest('.setright');
    if (!antiCheatSection) return false;

    const monitorHTML = `
    <div class="examMonitorControl" style="display: block;">
      <div class="setCt borderBom1">
        <span class="sp104 fs14 colorDeep fl">监考设置</span>
        <div class="fl setright">
          <!-- 截屏监控 -->
          <div class="set_con fabu">
            <span class="set_check fl set_checked" id="snapshotMonitor"></span>
            <span class="inpAfter fl">学生电脑端考试需截屏验证<b class="bz">学生授权允许后进行截图验证，检测学生是否本人参加考试</b></span>
            <div class="clear"></div>
          </div>
          <div class="screenAbnormalNumberLimitBlock" style="background:#f5f6f9;padding-left:20px;margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="screenAbnormalNumberLimitCheckBox"></span>
              <span class="inpAfter fl">截图异常的屏幕达到</span>
              <input type="text" class="inp80 fl" id="screenAbnormalNumberLimit" maxlength="3" onkeyup="this.value=this.value.replace(/\\D/g,'')" onafterpaste="this.value=this.value.replace(/\\D/g,'')">
              <span class="inpAfter fl">张时，停止该生考试</span>
              <div class="clear"></div>
            </div>
          </div>
          <div class="screenshotNumberLimitBlock" style="background:#f5f6f9;padding-left:20px;margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="screenshotNumberLimitCheckBox"></span>
              <span class="inpAfter fl">每</span>
              <input type="text" class="inp80 fl" id="screenshotNumberLimit" maxlength="3" onkeyup="this.value=this.value.replace(/\\D/g,'')" onafterpaste="this.value=this.value.replace(/\\D/g,'')">
              <span class="inpAfter fl">分钟不少于1张，截屏最少要求</span>
              <div class="clear"></div>
            </div>
          </div>
          <div class="screenshotOccupancyNumberLimitBlock" style="background:#f5f6f9;padding-left:20px;margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="screenshotOccupancyNumberLimitCheckBox"></span>
              <span class="inpAfter fl">截屏的<em>人脸识别</em>出勤率低于</span>
              <input type="text" class="inp80 fl" id="screenshotOccupancyNumberLimit" maxlength="3" onkeyup="this.value=this.value.replace(/\\D/g,'')" onafterpaste="this.value=this.value.replace(/\\D/g,'')">
              <span class="inpAfter fl">%时，停止该生考试</span>
              <div class="clear"></div>
            </div>
          </div>
          <!-- 网页截屏监控 -->
          <div class="webSnapshotMonitorBlock" style="background:#f5f6f9;padding-left:20px;margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="webSnapshotMonitorCheckBox"></span>
              <span class="inpAfter fl">网页端答题全程进行截屏监控</span>
              <div class="clear"></div>
            </div>
          </div>
          <!-- 人脸识别监控 -->
          <div class="monitorFaceRecognitionBlock" style="background:#f5f6f9;padding-left:20px;margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="monitorFaceRecognition"></span>
              <span class="inpAfter fl">学生电脑端考试需人脸识别</span>
              <div class="clear"></div>
            </div>
          </div>
          <!-- 人脸比对 -->
          <div class="faceCompareBlock" style="background:#f5f6f9;padding-left:20px;margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="faceCompare"></span>
              <span class="inpAfter fl">人脸识别比对不通过，不允许进入考试</span>
              <div class="clear"></div>
            </div>
          </div>
          <!-- 屏幕监控 -->
          <div class="screenMonitorBlock" style="margin-bottom:6px;">
            <div class="set_con">
              <span class="set_check fl set_checked" id="screenMonitor"></span>
              <span class="inpAfter fl">学生电脑端考试全程屏幕监控<b class="bz">管理员可在监考中查看学生答题的电脑界面</b></span>
              <div class="clear"></div>
            </div>
          </div>
          <!-- 单一设备特征锁定 -->
          <div class="set_con">
            <span class="set_check fl set_checked" id="terminalFeatureVerifyCheck"></span>
            <span class="inpAfter fl">单一设备特征锁定<b class="bz">学生初次进入考试时会强制与考试设备绑定，使用其他设备会被强制收卷</b></span>
            <div class="clear"></div>
          </div>
        </div>
        <div class="clear"></div>
      </div>
      <!-- 内置输入法 -->
      <div class="setCt borderBom1">
        <span class="sp104 fs14 colorDeep fl">输入设置</span>
        <div class="fl setright">
          <div class="set_con">
            <span class="set_check fl set_checked" id="customInputMethod"></span>
            <span class="inpAfter fl">强制使用学习通内置输入法<b class="bz">防止学生使用第三方输入法的联想、翻译、搜索等功能作弊</b></span>
            <div class="clear"></div>
          </div>
        </div>
        <div class="clear"></div>
      </div>
    </div>`;

    // 在防作弊区域末尾插入
    const parentCt = antiCheatSection.closest('.setCt');
    if (parentCt) {
      const monitorDiv = document.createElement('div');
      monitorDiv.innerHTML = monitorHTML;
      parentCt.insertAdjacentElement('afterend', monitorDiv.firstElementChild);
      console.log('[油猴] ✅ 已动态注入监考HTML');
      return true;
    }
    return false;
  }

  // ==================== 构建浮窗 ====================
  function buildPanel(showToastFn) {
    const toast = document.createElement('div');
    toast.className = 'cx-toast';
    toast.id = 'cx-toast';
    document.body.appendChild(toast);

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toast._t);
      toast._t = setTimeout(() => toast.classList.remove('show'), 2000);
    }

    const panel = document.createElement('div');
    panel.id = 'cx-unlock-panel';
    panel.innerHTML = `
      <div class="cx-panel-header" id="cx-panel-drag-handle">
        <span class="cx-panel-title">🔧 隐藏功能面板</span>
        <div class="cx-panel-actions">
          <button id="cx-btn-collapse" title="折叠/展开"><span class="cx-toggle-icon">▾</span></button>
        </div>
      </div>
      <div class="cx-panel-body">
        <div class="cx-section">
          <div class="cx-section-title">📌 总开关</div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-monitoring" checked><label for="cx-chk-monitoring">开启监考功能模块</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-pcclient" checked><label for="cx-chk-pcclient">开启电脑客户端考试</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-advanced" checked><label for="cx-chk-advanced">展开高级设置区域</label></div>
        </div>
        <div class="cx-section">
          <div class="cx-section-title">📷 监考设置</div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-snapshot" checked><label for="cx-chk-snapshot">截屏监控 & 子项</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-face" checked><label for="cx-chk-face">人脸识别监控</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-facecmp" checked><label for="cx-chk-facecmp">人脸比对（不通过禁入）</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-screenmon" checked><label for="cx-chk-screenmon">屏幕监控 & 异常次数</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-websnap" checked><label for="cx-chk-websnap">网页截屏监控</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-terminal" checked><label for="cx-chk-terminal">单一设备特征锁定</label></div>
        </div>
        <div class="cx-section">
          <div class="cx-section-title">⌨️ 输入 / 防作弊</div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-input" checked><label for="cx-chk-input">学习通内置输入法</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-switchscr" checked><label for="cx-chk-switchscr">切屏控制 & 阈值</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-lowver" checked><label for="cx-chk-lowver">禁止低版本APP</label></div>
        </div>
        <div class="cx-section">
          <div class="cx-section-title">📝 考试设置</div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-examcode" checked><label for="cx-chk-examcode">考试码验证</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-examtips" checked><label for="cx-chk-examtips">考试须知/提示</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-cloudfile" checked><label for="cx-chk-cloudfile">禁止云盘文件选项</label></div>
        </div>
        <div class="cx-section">
          <div class="cx-section-title">🎯 抽题 & 评分</div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-random" checked><label for="cx-chk-random">随机抽题区域</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-quescore" checked><label for="cx-chk-quescore">题型分数设置</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-eval" checked><label for="cx-chk-eval">生生互评模块</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-grade" checked><label for="cx-chk-grade">等级设置区域</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-retest" checked><label for="cx-chk-retest">重做重新抽题</label></div>
        </div>
        <div class="cx-section">
          <div class="cx-section-title">🧹 清理</div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-checkall"><label for="cx-chk-checkall">勾选页面上所有复选框</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-removedis"><label for="cx-chk-removedis">移除所有禁用/灰色状态</label></div>
          <div class="cx-row"><input type="checkbox" id="cx-chk-unhideall"><label for="cx-chk-unhideall">移除全部 display:none</label></div>
        </div>
      </div>
      <div class="cx-panel-footer">
        <button class="cx-btn cx-btn-ghost" id="cx-btn-all">全选</button>
        <button class="cx-btn cx-btn-reset" id="cx-btn-none">全不选</button>
        <button class="cx-btn cx-btn-primary" id="cx-btn-apply">应用所选</button>
      </div>
    `;
    document.body.appendChild(panel);

    // 拖拽
    const header = panel.querySelector('#cx-panel-drag-handle');
    let dragging = false, startX, startY, panelX, panelY;
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      dragging = true; panel.classList.add('dragging');
      const rect = panel.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      panelX = rect.left; panelY = rect.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = (panelX + e.clientX - startX) + 'px';
      panel.style.top = (panelY + e.clientY - startY) + 'px';
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; panel.classList.remove('dragging'); });

    // 折叠
    panel.querySelector('#cx-btn-collapse').addEventListener('click', () => {
      panel.classList.toggle('cx-collapsed');
    });

    // 全选/全不选
    function setAllChk(state) {
      panel.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = state; });
    }
    panel.querySelector('#cx-btn-all').addEventListener('click', () => setAllChk(true));
    panel.querySelector('#cx-btn-none').addEventListener('click', () => setAllChk(false));

    // 应用
    panel.querySelector('#cx-btn-apply').addEventListener('click', () => {
      // 先确保监考HTML已注入
      injectMonitoringHTML();
      const opts = {};
      panel.querySelectorAll('input[type="checkbox"]').forEach(cb => { opts[cb.id] = cb.checked; });
      applyUnlock(opts);
      showToast('✅ 已应用所选设置');
    });

    return { panel, toast, showToast };
  }

  // ==================== 解锁逻辑 ====================
  function applyUnlock(opt) {
    function byId(id) { return document.getElementById(id); }
    function bySel(sel) { return document.querySelector(sel); }
    function byAll(sel) { return document.querySelectorAll(sel); }

    // --- 总开关 ---
    if (opt['cx-chk-monitoring']) {
      const el = byId('examMonitoringSwitch');
      if (el) el.value = '1';
    }
    if (opt['cx-chk-pcclient']) {
      const el = byId('pcClientExamSwitch');
      if (el) el.value = '1';

      // 尝试切换 clientExam 为电脑客户端
      const clientExam = byId('clientExam');
      if (clientExam) {
        clientExam.classList.add('set_checked');
        const selectBox = byId('clientExamSelectBox');
        if (selectBox) {
          const p = selectBox.querySelector('p span');
          if (p) {
            p.setAttribute('value', '3');
            p.textContent = '手机APP或电脑考试客户端';
          }
        }
      }

      // 触发 pcClientExamSwitchControl
      if (typeof pcClientExamSwitchControl === 'function') {
        try { pcClientExamSwitchControl(3, false); } catch (e) { }
      }

      // 显示 pcclientControl
      const pcDiv = bySel('.pcclientControl');
      if (pcDiv) { pcDiv.style.display = ''; }
    }

    if (opt['cx-chk-advanced']) {
      const btn = bySel('.settingBtn');
      if (btn) btn.click();
    }

    // --- 监考设置 ---
    if (opt['cx-chk-snapshot']) {
      const el = byId('snapshotMonitor');
      if (el) el.classList.add('set_checked');
      if (typeof snapshotMonitorChange === 'function') {
        try { snapshotMonitorChange(); } catch (e) { }
      }
      // 显示子项
      ['.screenAbnormalNumberLimitBlock', '.screenshotNumberLimitBlock',
        '.screenshotOccupancyNumberLimitBlock'].forEach(s => {
          const e = bySel(s); if (e) e.style.display = '';
        });
    }

    if (opt['cx-chk-face']) {
      const el = byId('monitorFaceRecognition');
      if (el) el.classList.add('set_checked');
      const blk = bySel('.monitorFaceRecognitionBlock');
      if (blk) blk.style.display = '';
    }

    if (opt['cx-chk-facecmp']) {
      const el = byId('faceCompare');
      if (el) el.classList.add('set_checked');
      const blk = bySel('.faceCompareBlock');
      if (blk) blk.style.display = '';
    }

    if (opt['cx-chk-screenmon']) {
      const blk = bySel('.screenMonitorBlock');
      if (blk) blk.style.display = '';
      ['.screenAbnormalNumberLimitBlock', '#switchScreenThresholdTimeBox'].forEach(s => {
        const e = bySel(s); if (e) e.style.display = '';
      });
      if (typeof screenMonitorControl === 'function') {
        try { screenMonitorControl(3); } catch (e) { }
      }
    }

    if (opt['cx-chk-websnap']) {
      const blk = bySel('.webSnapshotMonitorBlock');
      if (blk) blk.style.display = '';
    }

    if (opt['cx-chk-terminal']) {
      const el = byId('terminalFeatureVerifyCheck');
      if (el) { el.classList.remove('no_checked_disable'); el.classList.add('set_checked'); }
    }

    // --- 输入 / 防作弊 ---
    if (opt['cx-chk-input']) {
      const el = byId('customInputMethod');
      if (el) el.classList.add('set_checked');
    }

    if (opt['cx-chk-switchscr']) {
      const el = byId('switchScreenControl');
      if (el) el.classList.add('set_checked');
      const box = byId('switchScreenThresholdTimeBox');
      if (box) box.style.display = '';
      const blk = bySel('.switchScreenThresholdTimeBox');
      if (blk) blk.style.display = '';
    }

    if (opt['cx-chk-lowver']) {
      const blk = bySel('.appForbidLowversionEnterBlock');
      if (blk) blk.style.display = '';
    }

    // --- 考试设置 ---
    if (opt['cx-chk-examcode']) {
      const el = byId('examCodeCheck');
      if (el) el.classList.add('set_checked');
      const blk = bySel('.identifyCodeCheckDiv');
      if (blk) blk.style.display = '';
    }

    if (opt['cx-chk-examtips']) {
      const el = byId('examTipsCheck');
      if (el) el.classList.add('set_checked');
      ['.examTipsTextareaCon', '.examPreparationTimeBlock',
        '.examNotesDiv', '.pcExamNotesDiv'].forEach(s => {
          const e = bySel(s); if (e) e.style.display = '';
        });
    }

    if (opt['cx-chk-cloudfile']) {
      const blk = bySel('.forbidCloudFileDiv');
      if (blk) blk.style.display = '';
    }

    // --- 抽题 & 评分 ---
    if (opt['cx-chk-random']) {
      const el = byId('randomSelectDiv');
      if (el) { el.style.display = ''; el.removeAttribute('style'); }
      const el2 = byId('questionTypeRandomDiv');
      if (el2) { el2.style.display = ''; el2.removeAttribute('style'); }
    }

    if (opt['cx-chk-quescore']) {
      byAll('.setScore').forEach(e => { e.style.display = ''; e.removeAttribute('style'); });
      const el = byId('totalScore');
      if (el) { el.style.display = ''; el.removeAttribute('style'); }
    }

    if (opt['cx-chk-eval']) {
      const el = byId('evaluation');
      if (el && el.classList.contains('show_switch')) {
        el.classList.remove('show_switch');
        el.classList.add('hide_switch');
      }
      const hpGray = bySel('.hpGray');
      if (hpGray) { hpGray.style.display = ''; hpGray.removeAttribute('style'); }
    }

    if (opt['cx-chk-grade']) {
      const el = bySel('.gradeSection');
      if (el) { el.style.display = ''; el.removeAttribute('style'); }
    }

    if (opt['cx-chk-retest']) {
      const blk = bySel('.retestRandomTypeDiv');
      if (blk) blk.style.display = '';
    }

    // --- 清理 ---
    if (opt['cx-chk-checkall']) {
      byAll('.set_check').forEach(el => {
        if (!el.classList.contains('set_checked')) el.classList.add('set_checked');
      });
      byAll('.set_check_dx').forEach(el => {
        if (!el.classList.contains('set_checked_dx')) el.classList.add('set_checked_dx');
      });
    }

    if (opt['cx-chk-removedis']) {
      byAll('.no_checked_disable').forEach(el => el.classList.remove('no_checked_disable'));
      byAll('.limit_gray_con').forEach(el => el.classList.remove('limit_gray_con'));
    }

    if (opt['cx-chk-unhideall']) {
      const blocks = [
        '.examMonitorControl', '.pcclientControl', '.screenMonitorBlock',
        '.webSnapshotMonitorBlock', '.monitorFaceRecognitionBlock', '.faceCompareBlock',
        '.examPreparationTimeBlock', '.examTipsTextareaCon', '.examNotesDiv',
        '.pcExamNotesDiv', '.switchScreenThresholdTimeBox', '.appForbidLowversionEnterBlock',
        '.retestRandomTypeDiv', '.forbidCloudFileDiv', '.identifyCodeCheckDiv',
        '.screenAbnormalNumberLimitBlock', '.screenshotNumberLimitBlock',
        '.screenshotOccupancyNumberLimitBlock', '#randomSelectDiv', '#questionTypeRandomDiv',
      ];
      blocks.forEach(s => {
        try { const e = bySel(s); if (e) { e.style.display = ''; e.removeAttribute('style'); } } catch (_) { }
      });

      byAll('*').forEach(el => {
        const style = el.getAttribute('style') || '';
        if (/display\s*:\s*none/i.test(style)) {
          if (el.tagName === 'SCRIPT') return;
          if (el.classList.contains('maskDiv')) return;
          if (el.classList.contains('options')) return;
          if (el.classList.contains('grade_rename_con')) return;
          el.setAttribute('style', style.replace(/display\s*:\s*none\s*;?/gi, ''));
        }
      });
    }

    // 确保 examMonitorControl 可见
    if (opt['cx-chk-monitoring']) {
      const monitorDiv = bySel('.examMonitorControl');
      if (monitorDiv) monitorDiv.style.display = '';
      // 再次调用 pcClientExamSwitchControl
      if (typeof pcClientExamSwitchControl === 'function') {
        try { pcClientExamSwitchControl(3, false); } catch (e) { }
      }
    }

    // 屏幕监控函数触发
    if (opt['cx-chk-screenmon'] && typeof screenMonitorControl === 'function') {
      try { screenMonitorControl(3); } catch (e) { }
    }

    console.log('[油猴] 已按所选选项应用解锁');
  }

  // ==================== 页面检测 ====================
  function isExamPublishPage() {
    return document.querySelector('#examMonitoringSwitch') ||
      document.querySelector('.publishPaperMain') ||
      document.querySelector('.setCt') && document.querySelector('#courseid');
  }

  // ==================== 等待 & 启动 ====================
  function tryInit(retries, delay) {
    retries = retries || 15;
    delay = delay || 1000;
    let attempt = 0;

    function check() {
      attempt++;
      const ready = typeof $ !== 'undefined' && isExamPublishPage();

      if (ready || attempt >= retries) {
        if (!ready) { console.log('[油猴] 未检测到考试发布页面，退出'); return; }

        // 第一步：注入监考HTML（如果缺失）
        const injected = injectMonitoringHTML();
        console.log('[油猴] 监考HTML注入结果:', injected);

        // 第二步：构建浮窗
        const { showToast } = buildPanel();

        // 第三步：延迟自动应用
        setTimeout(() => {
          const panelEl = document.getElementById('cx-unlock-panel');
          if (!panelEl) return;
          const opts = {};
          panelEl.querySelectorAll('input[type="checkbox"]').forEach(cb => { opts[cb.id] = cb.checked; });
          applyUnlock(opts);
          showToast('🚀 已自动应用全部设置，可按需取消后再次点击「应用所选」');
        }, 300);

      } else {
        setTimeout(check, delay);
      }
    }
    check();
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tryInit());
  } else {
    tryInit();
  }

  // MutationObserver：监听DOM变化，检测到考试发布页时注入
  const obs = new MutationObserver(() => {
    if (!document.getElementById('cx-unlock-panel') && isExamPublishPage()) {
      tryInit(3, 500);
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

})();
