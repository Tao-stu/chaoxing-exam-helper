// ==UserScript==
// @name         超星考试助手
// @namespace    https://github.com/Tao-stu/chaoxing-exam-helper
// @version      1.0
// @description  解除限制、导出题目选项、按规则填入答案
// @author       @小夏不菜吖
// @match        *://*/*整卷预览*
// @match        *://*.chaoxing.com/exam-ans/*
// @match        file:///*整卷预览*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ===== 1. 样式注入 =====
    const style = document.createElement('style');
    style.textContent = `
#cx-helper-panel {
    position: fixed;
    top: 80px;
    right: 10px;
    z-index: 99999;
    width: 320px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.18);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
    font-size: 13px;
    overflow: hidden;
    user-select: none;
}
#cx-helper-panel .cx-header {
    background: linear-gradient(135deg, #2563EB, #3B82F6);
    color: #fff;
    padding: 10px 14px;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
#cx-helper-panel .cx-header span { font-weight: 600; font-size: 14px; }
#cx-helper-panel .cx-header button {
    background: rgba(255,255,255,0.2);
    border: none;
    color: #fff;
    border-radius: 4px;
    padding: 3px 8px;
    cursor: pointer;
    font-size: 12px;
}
#cx-helper-panel .cx-header button:hover { background: rgba(255,255,255,0.35); }
#cx-helper-panel .cx-body { padding: 12px 14px; }
#cx-helper-panel .cx-body .cx-row { margin-bottom: 10px; }
#cx-helper-panel .cx-body label { display: block; margin-bottom: 4px; color: #374151; font-weight: 500; }
#cx-helper-panel .cx-body textarea {
    width: 100%;
    height: 80px;
    border: 1px solid #D1D5DB;
    border-radius: 6px;
    padding: 8px;
    font-size: 12px;
    resize: vertical;
    box-sizing: border-box;
}
#cx-helper-panel .cx-body textarea:focus { outline: none; border-color: #2563EB; }
#cx-helper-panel .cx-btn-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
#cx-helper-panel .cx-btn {
    flex: 1;
    min-width: 60px;
    padding: 7px 4px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.15s;
}
#cx-helper-panel .cx-btn-primary { background: #2563EB; color: #fff; }
#cx-helper-panel .cx-btn-primary:hover { background: #1D4ED8; }
#cx-helper-panel .cx-btn-success { background: #059669; color: #fff; }
#cx-helper-panel .cx-btn-success:hover { background: #047857; }
#cx-helper-panel .cx-btn-warning { background: #D97706; color: #fff; }
#cx-helper-panel .cx-btn-warning:hover { background: #B45309; }
#cx-helper-panel .cx-btn-info { background: #7C3AED; color: #fff; }
#cx-helper-panel .cx-btn-info:hover { background: #6D28D9; }
#cx-helper-panel .cx-btn-danger { background: #DC2626; color: #fff; }
#cx-helper-panel .cx-btn-danger:hover { background: #B91C1C; }
#cx-helper-panel .cx-stats {
    font-size: 11px;
    color: #6B7280;
    margin-top: 6px;
    text-align: center;
    min-height: 18px;
}
#cx-helper-panel .cx-stats.success { color: #059669; }
#cx-helper-panel .cx-stats.error { color: #DC2626; }
#cx-helper-panel .cx-btn-full { width: 100%; margin-top: 2px; }

/* 导出弹窗 */
#cx-export-modal {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 100000;
    background: rgba(0,0,0,0.45);
    display: none;
    justify-content: center;
    align-items: center;
}
#cx-export-modal .cx-modal-box {
    background: #fff;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
#cx-export-modal .cx-modal-header {
    padding: 14px 18px;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 15px;
}
#cx-export-modal .cx-modal-header button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #9CA3AF;
}
#cx-export-modal .cx-modal-header button:hover { color: #374151; }
#cx-export-modal .cx-modal-body {
    padding: 14px 18px;
    overflow-y: auto;
    flex: 1;
    white-space: pre-wrap;
    font-family: "Consolas", "Microsoft YaHei", monospace;
    font-size: 12px;
    line-height: 1.7;
    color: #1F2937;
}
#cx-export-modal .cx-modal-footer {
    padding: 10px 18px;
    border-top: 1px solid #E5E7EB;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}
#cx-export-modal .cx-modal-footer button {
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
}
`;
    document.head.appendChild(style);

    // ===== 2. 浮动面板 HTML =====
    const panel = document.createElement('div');
    panel.id = 'cx-helper-panel';
    panel.innerHTML = `
        <div class="cx-header" id="cx-drag-handle">
            <span>📋 考试助手</span>
            <div>
                <button id="cx-minimize" title="最小化">▬</button>
                <button id="cx-close" title="关闭">✕</button>
            </div>
        </div>
        <div class="cx-body" id="cx-panel-body">
            <div class="cx-btn-row">
                <button class="cx-btn cx-btn-danger" id="cx-unlock">🔓 解除限制</button>
                <button class="cx-btn cx-btn-info" id="cx-export">📤 导出题目</button>
            </div>
            <label>📝 自定义填入答案（格式：题号.答案 空格分隔）</label>
            <textarea id="cx-answer-input" placeholder="例: 1.A 2.C 3.B 4.D 5.A&#10;支持: 1.A 2.ABC(多选) 3.对(判断)&#10;简答: 6.这是简答题的答案内容"></textarea>
            <button class="cx-btn cx-btn-primary cx-btn-full" id="cx-fill-custom">⚡ 填入自定义答案</button>
            <div class="cx-stats" id="cx-stats"></div>
        </div>
    `;
    document.body.appendChild(panel);

    // ===== 3. 导出弹窗 =====
    const modal = document.createElement('div');
    modal.id = 'cx-export-modal';
    modal.innerHTML = `
        <div class="cx-modal-box">
            <div class="cx-modal-header">
                <span>📤 题目与选项导出</span>
                <button id="cx-modal-close">✕</button>
            </div>
            <div class="cx-modal-body" id="cx-modal-content"></div>
            <div class="cx-modal-footer">
                <button class="cx-btn cx-btn-primary" id="cx-copy-all">复制全部</button>
                <button class="cx-btn" id="cx-modal-close2" style="background:#E5E7EB;color:#374151;">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // ===== 4. 核心功能 =====

    function showStats(msg, type) {
        const el = document.getElementById('cx-stats');
        el.textContent = msg;
        el.className = 'cx-stats ' + (type || '');
        if (type === 'success') {
            setTimeout(() => { el.textContent = ''; el.className = 'cx-stats'; }, 3000);
        }
    }

    // 4.1 解除所有限制
    function unlockAll() {
        // 文本选择
        document.body.onselectstart = null;
        document.body.onselectstart = function () { return true; };
        document.oncontextmenu = null;
        document.body.oncopy = null;
        document.body.oncut = null;
        document.body.onpaste = null;

        // 所有元素解除 user-select
        document.querySelectorAll('*').forEach(el => {
            el.style.userSelect = 'auto';
            el.style.webkitUserSelect = 'auto';
        });

        // 移除键盘事件
        $(document).off('keydown');
        $(document).off('copy cut paste contextmenu selectstart');

        // 移除复制阻止
        document.querySelectorAll('[oncopy]').forEach(el => el.removeAttribute('oncopy'));
        document.querySelectorAll('[onselectstart]').forEach(el => el.removeAttribute('onselectstart'));

        // ===== 核心：解除新版页面(xinwangye)的简答题输入限制 =====

        // 1. 强制所有 .sub_que_div 容器可交互（pointer-events: none 导致无法点击/输入）
        document.querySelectorAll('.sub_que_div').forEach(function (el) {
            el.style.setProperty('pointer-events', 'auto', 'important');
        });
        // 也解除 .sub_que_div_parent 的限制
        document.querySelectorAll('.sub_que_div_parent').forEach(function (el) {
            el.style.setProperty('pointer-events', 'auto', 'important');
        });

        // 2. 覆盖 checkSubmitButton，阻止"请保存答案"造成的自动 blur
        if (typeof checkSubmitButton === 'function') {
            var _origCheckSubmit = checkSubmitButton;
            window.checkSubmitButton = function () {
                // 先调用原始函数（确保正确的业务逻辑），但忽略返回值
                try { _origCheckSubmit.apply(this, arguments); } catch (e) { }
                return true; // 始终允许聚焦
            };
        }

        // 3. 保存原始 editorPaste，然后覆盖为新函数（新版页面在 ready 回调中通过闭包引用全局 editorPaste）
        var _origEditorPaste = window.editorPaste;
        window.editorPaste = function (o, html) {
            return true; // 允许粘贴通过
        };

        // 4. 修改 allowPaste 值为 1
        var allowPasteEl = document.getElementById('allowPaste');
        if (allowPasteEl) {
            allowPasteEl.value = '1';
        }

        // 5. 解除 UEditor 已有实例的粘贴限制（使用原始函数引用才能成功 removeListener）
        function removeEditorPasteListener(ed) {
            if (!ed || !ed.removeListener) return;
            // 尝试用原始函数引用移除（如果 ready 已触发，监听器用旧引用注册的）
            if (_origEditorPaste) ed.removeListener('beforepaste', _origEditorPaste);
            // 也尝试用新函数引用移除（如果 ready 未触发，但某种原因用了新引用）
            ed.removeListener('beforepaste', window.editorPaste);
        }

        try {
            if (typeof UE !== 'undefined') {
                // 遍历 UE.instants（UEditor 内部实例存储，注意是 instants 不是 instances）
                var editorMap = UE.instants;
                if (editorMap) {
                    for (var key in editorMap) {
                        if (editorMap.hasOwnProperty(key)) {
                            try { removeEditorPasteListener(editorMap[key]); } catch (e) { }
                        }
                    }
                }

                // 6. 重写 UE.getEditor，拦截后续编辑器（ready 回调异步添加 beforepaste）
                if (!UE._cxHelperPatched) {
                    UE._cxHelperPatched = true;
                    var _origGetEditor = UE.getEditor;
                    UE.getEditor = function () {
                        var ed = _origGetEditor.apply(this, arguments);
                        if (ed) {
                            // 立即尝试移除
                            removeEditorPasteListener(ed);
                            // ready 是异步的，延迟再移除
                            setTimeout(function () { removeEditorPasteListener(ed); }, 300);
                            setTimeout(function () { removeEditorPasteListener(ed); }, 800);
                        }
                        return ed;
                    };
                }
            }
        } catch (e) {
            console.log('[考试助手] 解除UEditor限制时出错:', e);
        }

        // 7. 延迟处理：等所有 UEditor ready 回调触发后再次清理
        function delayedCleanup() {
            try {
                if (typeof UE !== 'undefined' && UE.instants) {
                    for (var k in UE.instants) {
                        if (UE.instants.hasOwnProperty(k)) {
                            try {
                                var editor = UE.instants[k];
                                removeEditorPasteListener(editor);
                                // 同时解除 iframe body 上的 paste 事件拦截
                                if (editor && editor.body) {
                                    editor.body.onpaste = null;
                                }
                            } catch (e) { }
                        }
                    }
                }
                // 再次确保 pointer-events 和 user-select
                document.querySelectorAll('.sub_que_div, .sub_que_div_parent').forEach(function (el) {
                    el.style.setProperty('pointer-events', 'auto', 'important');
                });
                document.querySelectorAll('*').forEach(function (el) {
                    el.style.userSelect = 'auto';
                    el.style.webkitUserSelect = 'auto';
                });
            } catch (e) { }
        }
        setTimeout(delayedCleanup, 500);
        setTimeout(delayedCleanup, 1500);
        setTimeout(delayedCleanup, 3000);

        // 停止倒计时
        if (typeof timers !== 'undefined') clearInterval(timers);

        showStats('✅ 所有限制已解除（选择/复制/右键/粘贴/输入）', 'success');
    }

    // 4.2 导出题目
    function exportQuestions() {
        let output = '';
        let count = 0;

        // 找到所有 section 标题和题目
        const allSections = [];
        const typeTits = document.querySelectorAll('.type_tit');
        const questionLis = document.querySelectorAll('.questionLi');

        questionLis.forEach((li) => {
            const qid = li.getAttribute('data');
            if (!qid) return;
            count++;

            // 获取题型标题
            const typeTit = li.closest('.mark_table')?.querySelector('.type_tit');
            const typeName = typeTit ? typeTit.textContent.trim() : '';

            // 获取题号
            const markName = li.querySelector('.mark_name');
            let qNum = count;
            if (markName) {
                const numMatch = markName.textContent.match(/^(\d+)/);
                if (numMatch) qNum = parseInt(numMatch[1]);
            }

            // 获取题目文字
            let qText = '';
            if (markName) {
                const textDiv = markName.querySelector('div');
                if (textDiv) {
                    qText = textDiv.textContent.replace(/\s+/g, ' ').trim();
                }
            }

            // 获取选项
            const answerPgs = li.querySelectorAll('.answer_p');
            let options = [];
            answerPgs.forEach((p) => {
                options.push(p.textContent.trim());
            });

            // 获取正确答案 — 同时从 check_answer 类回退
            const hiddenInput = document.getElementById('answer' + qid);
            let correctAnswer = hiddenInput ? (hiddenInput.value || hiddenInput.getAttribute('value') || '') : '';
            if (!correctAnswer) {
                const checkedSpan = li.querySelector('.choice' + qid + '.check_answer, .choice' + qid + '.check_answer_dx');
                if (checkedSpan) correctAnswer = checkedSpan.getAttribute('data') || '';
            }

            // 获取题型信息 — 在 li 范围内查找
            const typeInput = li.querySelector('input[name="type' + qid + '"]');
            const typeNameInput = li.querySelector('input[name="typeName' + qid + '"]');
            const qTypeName = typeNameInput ? typeNameInput.value : '未知';
            const qType = typeInput ? typeInput.value : '';
            const typeMap = { '0': '单选题', '1': '多选题', '2': '填空题', '3': '判断题', '4': '简答题', '5': '名词解释', '6': '论述题', '7': '计算题', '8': '其他题' };
            const qTypeStr = qTypeName || typeMap[qType] || '未知';

            // 构建输出
            output += `【${count}. ${qTypeStr}】${qText}\n`;
            if (options.length > 0) {
                const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                options.forEach((opt, i) => {
                    output += `  ${labels[i] || i + 1}. ${opt}\n`;
                });
            }
            if (correctAnswer) {
                if (qType === '0') {
                    // 单选题
                    const idx = 'ABCDEFGH'.indexOf(correctAnswer);
                    if (idx >= 0 && idx < options.length) {
                        output += `  ✅ 答案: ${correctAnswer} (${options[idx]})\n`;
                    } else {
                        output += `  ✅ 答案: ${correctAnswer}\n`;
                    }
                } else if (qType === '3') {
                    // 判断题：data 值是 true/false，映射为 A(对)/B(错)
                    if (correctAnswer === 'true' || correctAnswer === 'A' || correctAnswer === '对' || correctAnswer === '是') {
                        output += `  ✅ 答案: A (对)\n`;
                    } else if (correctAnswer === 'false' || correctAnswer === 'B' || correctAnswer === '错' || correctAnswer === '否') {
                        output += `  ✅ 答案: B (错)\n`;
                    } else {
                        output += `  ✅ 答案: ${correctAnswer}\n`;
                    }
                } else if (qType === '1') {
                    // 多选题
                    const ansText = correctAnswer.split('').map(ch => {
                        const idx = 'ABCDEFGH'.indexOf(ch);
                        return idx >= 0 && idx < options.length ? `${ch}(${options[idx]})` : ch;
                    }).join(' ');
                    output += `  ✅ 答案: ${ansText}\n`;
                } else {
                    output += `  ✅ 答案: ${correctAnswer}\n`;
                }
            }
            output += '\n';
        });

        const contentEl = document.getElementById('cx-modal-content');
        contentEl.textContent = output || '未找到题目数据';
        document.getElementById('cx-export-modal').style.display = 'flex';

        showStats(`已导出 ${count} 道题`, 'success');
    }

    // 判断题 data 值映射：用户可能输入 A/B，但判断题选项 data 值是 true/false
    function mapJudgeAnswer(answer) {
        const judgeMap = {
            'A': 'true', 'B': 'false', '对': 'true', '错': 'false', '是': 'true', '否': 'false',
            '✓': 'true', '✗': 'false', '√': 'true', '×': 'false',
            'true': 'true', 'false': 'false', 'TRUE': 'true', 'FALSE': 'false'
        };
        return judgeMap[answer] || answer;
    }

    // 辅助函数：通过 UEditor API 设置简答题/论述题内容
    // 新版页面(xinwangye)的简答题使用 UEditor 富文本编辑器，直接设 textarea.value 无效
    function setEssayContent(qid, content) {
        var editorId = 'answer' + qid;
        var success = false;

        // 方法1：通过 UE.getEditor + setContent
        try {
            if (typeof UE !== 'undefined') {
                var editor = UE.getEditor(editorId);
                if (editor) {
                    // UEditor.setContent 内部有队列机制，即使未 ready 也会在 ready 后应用
                    editor.setContent(content);
                    success = true;
                }
                // 方法2：直接查 UE.instants（UEditor 内部实例映射表）
                if (!success && UE.instants && UE.instants[editorId]) {
                    UE.instants[editorId].setContent(content);
                    success = true;
                }
            }
        } catch (e) {
            console.log('[考试助手] UEditor setContent 出错:', e);
        }

        // 方法3：兜底 - 同步设置底层 textarea（避免 UEditor 不可用的情况）
        var textarea = document.querySelector('textarea[name="' + editorId + '"]');
        if (textarea) {
            textarea.value = content;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            if (typeof $ !== 'undefined' && $.fn.autoHeight) {
                $(textarea).trigger('input');
            }
            success = true;
        }

        return success;
    }

    // 辅助函数：更新整卷预览面板 - 将已作答题目的卡片标为 active
    function updatePreviewCards(dataIds) {
        if (!dataIds || dataIds.length === 0) return;
        if (typeof changeQuestionCardColor !== 'function') return;
        dataIds.forEach(function (dataId) {
            try { changeQuestionCardColor(dataId); } catch (e) { }
        });
    }

    // 辅助函数：触发页面的保存机制（AJAX 保存或表单序列化）+ 更新整卷预览卡片
    function triggerBatchSave(doneDataIds) {
        try {
            // 1. 立即更新整卷预览面板卡片颜色（即时视觉反馈，不等 AJAX 返回）
            updatePreviewCards(doneDataIds);

            // 2. 标记所有已填入答案的题目为未保存状态
            document.querySelectorAll('.questionLi').forEach(function (li) {
                var dataId = li.getAttribute('data');
                if (!dataId) return;
                var hi = document.getElementById('answer' + dataId);
                if (hi && hi.value) {
                    li.classList.add('_unsavedstate');
                }
            });

            // 3. 调用页面的批量保存机制
            if (typeof deTectUnSaveQues === 'function' && typeof submitForm === 'function') {
                var questionWrap = deTectUnSaveQues();
                if (questionWrap && questionWrap.length > 0) {
                    submitForm(true, questionWrap, function () {
                        // 保存成功后重新更新卡片颜色
                        updatePreviewCards(doneDataIds);
                        if (typeof checkSubmitButton === 'function') {
                            try { checkSubmitButton(); } catch (e) { }
                        }
                        showStats('✅ 答案已保存到服务器', 'success');
                    });
                } else if (doneDataIds && doneDataIds.length > 0) {
                    // deTectUnSaveQues 没检测到（预览模式），直接只更新卡片
                    showStats('✅ 已填入答案 (预览模式)', 'success');
                }
            } else if (doneDataIds && doneDataIds.length > 0) {
                showStats('✅ 已填入答案', 'success');
            }
        } catch (e) {
            console.log('[考试助手] 批量保存失败:', e);
        }
    }

    // 4.3 解析并填入自定义答案
    function fillCustomAnswers() {
        const raw = document.getElementById('cx-answer-input').value.trim();
        if (!raw) {
            showStats('⚠️ 请先输入答案', 'error');
            return;
        }

        // 按行分割，再按空格/逗号/分号分割
        const lines = raw.split(/[\n\r]+/).filter(s => s.trim());
        const answerMap = {};

        lines.forEach(line => {
            // 尝试按分隔符拆分成多个答案对
            const rawPairs = line.split(/[\s,;，；]+/).filter(s => s.trim());
            // 重新合并被误拆的文本答案
            const mergedPairs = mergeTextPairs(rawPairs);
            mergedPairs.forEach(pair => {
                const trimmed = pair.trim();
                // 格式1: 1.A 或 1.A(可选文字) — 选择题/判断题
                const choiceMatch = trimmed.match(/^(\d+)\s*[.、:：\-—]\s*([A-Za-z对错是非√×✓✗]+)(?:\([^)]*\))?$/);
                if (choiceMatch) {
                    const num = parseInt(choiceMatch[1]);
                    const ans = choiceMatch[2].toUpperCase()
                        .replace('对', '✓').replace('是', '✓').replace('√', '✓').replace('×', '✗')
                        .replace('错', '✗').replace('非', '✗');
                    answerMap[num] = { type: 'choice', answer: ans };
                    return;
                }
                // 格式2: 1.文本内容 — 简答题/论述题
                const textMatch = trimmed.match(/^(\d+)\s*[.、:：\-—]\s*(.+)$/);
                if (textMatch) {
                    const num = parseInt(textMatch[1]);
                    const ans = textMatch[2].trim();
                    answerMap[num] = { type: 'text', answer: ans };
                }
            });
        });

        if (Object.keys(answerMap).length === 0) {
            showStats('⚠️ 未识别到有效答案，格式: 1.A 2.C 或 1.答案内容', 'error');
            return;
        }

        let total = 0, done = 0, skipped = 0;
        const doneDataIds = [];

        document.querySelectorAll('.questionLi').forEach((li) => {
            const qid = li.getAttribute('data');
            if (!qid) return;

            const markName = li.querySelector('.mark_name');
            let qNum = 0;
            if (markName) {
                const numMatch = markName.textContent.match(/^(\d+)/);
                if (numMatch) qNum = parseInt(numMatch[1]);
            }
            if (qNum === 0) return;

            total++;
            const userAnswer = answerMap[qNum];
            if (!userAnswer) { skipped++; return; }

            const hiddenInput = document.getElementById('answer' + qid);
            const typeInput = li.querySelector('input[name="type' + qid + '"]');
            const qType = typeInput ? typeInput.value : '0';
            const choices = li.querySelectorAll('.choice' + qid);

            // 选择题：单选/多选/判断
            if (choices.length > 0 && userAnswer.type === 'choice') {
                if (qType === '1') {
                    // 多选题
                    choices.forEach(ch => ch.classList.remove('check_answer_dx'));
                    userAnswer.answer.split('').forEach(ch => {
                        const target = li.querySelector('.choice' + qid + '[data="' + ch + '"]');
                        if (target) target.classList.add('check_answer_dx');
                    });
                    if (hiddenInput) hiddenInput.value = userAnswer.answer;
                    done++;
                    doneDataIds.push(qid);
                } else {
                    // 单选题/判断题
                    const answerChar = userAnswer.answer.length > 1 ? userAnswer.answer[0] : userAnswer.answer;
                    choices.forEach(ch => ch.classList.remove('check_answer'));

                    // 判断题：data值是 true/false，需要映射
                    let lookupAnswer = answerChar;
                    if (qType === '3') {
                        lookupAnswer = mapJudgeAnswer(answerChar);
                    }

                    let target = li.querySelector('.choice' + qid + '[data="' + lookupAnswer + '"]');
                    // 回退：判断题用 A/B 搜不到，尝试 true/false
                    if (!target && qType === '3' && lookupAnswer !== answerChar) {
                        target = li.querySelector('.choice' + qid + '[data="' + answerChar + '"]') ||
                            li.querySelector('.choice' + qid + '[data="' + answerChar.toLowerCase() + '"]');
                    }
                    // 再回退：尝试对/是/错/否
                    if (!target && answerChar === '✓') {
                        target = li.querySelector('.choice' + qid + '[data="对"]') ||
                            li.querySelector('.choice' + qid + '[data="是"]') ||
                            li.querySelector('.choice' + qid + '[data="true"]');
                    }
                    if (!target && answerChar === '✗') {
                        target = li.querySelector('.choice' + qid + '[data="错"]') ||
                            li.querySelector('.choice' + qid + '[data="否"]') ||
                            li.querySelector('.choice' + qid + '[data="false"]');
                    }
                    if (target) {
                        target.classList.add('check_answer');
                        if (hiddenInput) hiddenInput.value = answerChar;
                        done++;
                        doneDataIds.push(qid);
                    }
                }
            } else if (choices.length === 0 || userAnswer.type === 'text') {
                // 非选择题：简答题/论述题/填空题
                const answerText = userAnswer.answer;
                const qTypeNum = parseInt(qType) || 0;

                // 简答题/论述题/名词解释等：使用 UEditor 富文本编辑器
                if ([4, 5, 6, 7, 8].indexOf(qTypeNum) >= 0) {
                    if (setEssayContent(qid, answerText)) {
                        if (hiddenInput) hiddenInput.value = answerText;
                        done++;
                        doneDataIds.push(qid);
                    }
                } else {
                    // 填空题（type=2）：使用普通 textarea
                    const editorTextareas = li.querySelectorAll('textarea[name^="answerEditor' + qid + '"]');
                    if (editorTextareas.length > 0) {
                        const parts = answerText.split(/[;；]\s*/);
                        editorTextareas.forEach((ta, i) => {
                            if (parts[i]) {
                                ta.value = parts[i].trim();
                                ta.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        });
                        if (hiddenInput) {
                            const fillBlanks = [];
                            editorTextareas.forEach((ta, i) => {
                                fillBlanks.push({ name: String(i), content: ta.value });
                            });
                            hiddenInput.value = JSON.stringify(fillBlanks);
                        }
                        done++;
                        doneDataIds.push(qid);
                    } else {
                        // 兜底：尝试 UEditor + textarea
                        if (setEssayContent(qid, answerText)) {
                            if (hiddenInput) hiddenInput.value = answerText;
                            done++;
                            doneDataIds.push(qid);
                        }
                    }
                }
            }
        });

        showStats(`✅ 已填入 ${done}/${total} 题 (跳过 ${skipped} 题未匹配)`, 'success');
        // 触发批量保存 + 更新整卷预览卡片
        if (done > 0) triggerBatchSave(doneDataIds);
    }

    // 合并被空格误拆的文本答案对
    // 例如 "1.这是 答案 内容" 被 split 成 ["1.这是", "答案", "内容"] 时，合并回 "1.这是 答案 内容"
    function mergeTextPairs(pairs) {
        if (pairs.length === 0) return [];
        const result = [];
        let buffer = null;
        pairs.forEach(item => {
            // 如果以 "数字." 或 "数字:" 等开头，是新的答案对
            const isNewPair = /^\d+\s*[.、:：\-—]/.test(item);
            if (isNewPair) {
                if (buffer !== null) result.push(buffer);
                buffer = item;
            } else if (buffer !== null) {
                buffer += ' ' + item;
            } else {
                // 孤立的文本，尝试作为新条目
                result.push(item);
            }
        });
        if (buffer !== null) result.push(buffer);
        return result;
    }

    // 4.5 关闭弹窗
    function closeModal() {
        document.getElementById('cx-export-modal').style.display = 'none';
    }

    // 4.6 复制全部
    function copyAll() {
        const text = document.getElementById('cx-modal-content').textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showStats('✅ 已复制到剪贴板', 'success');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showStats('✅ 已复制到剪贴板', 'success'); }
        catch (e) { showStats('❌ 复制失败，请手动选择', 'error'); }
        document.body.removeChild(ta);
    }

    // ===== 5. 事件绑定 =====
    document.getElementById('cx-unlock').addEventListener('click', unlockAll);
    document.getElementById('cx-export').addEventListener('click', exportQuestions);
    document.getElementById('cx-fill-custom').addEventListener('click', fillCustomAnswers);
    document.getElementById('cx-copy-all').addEventListener('click', copyAll);
    document.getElementById('cx-modal-close').addEventListener('click', closeModal);
    document.getElementById('cx-modal-close2').addEventListener('click', closeModal);
    document.getElementById('cx-export-modal').addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });

    // 最小化/关闭
    let minimized = false;
    document.getElementById('cx-minimize').addEventListener('click', function () {
        const body = document.getElementById('cx-panel-body');
        minimized = !minimized;
        body.style.display = minimized ? 'none' : '';
        this.textContent = minimized ? '□' : '▬';
    });
    document.getElementById('cx-close').addEventListener('click', function () {
        document.getElementById('cx-helper-panel').remove();
        document.getElementById('cx-export-modal').remove();
    });

    // 拖拽功能
    const dragHandle = document.getElementById('cx-drag-handle');
    let isDragging = false, startX, startY, startLeft, startTop;
    dragHandle.addEventListener('mousedown', function (e) {
        if (e.target.tagName === 'BUTTON') return;
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        panel.style.transition = 'none';
        e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panel.style.left = (startLeft + dx) + 'px';
        panel.style.top = (startTop + dy) + 'px';
        panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', function () {
        if (isDragging) {
            isDragging = false;
            panel.style.transition = '';
        }
    });

    // 输入框快捷键：Ctrl+Enter 填入答案
    document.getElementById('cx-answer-input').addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            fillCustomAnswers();
        }
    });

    // ===== 6. 自动执行解锁 =====
    // 延迟执行确保页面完全加载
    setTimeout(unlockAll, 500);

    console.log('[考试助手] 已就绪');
    console.log('  面板位置: 右上角浮动窗口');
    console.log('  功能: 解除限制 | 导出题目 | 自定义填答案');
    console.log('  自定义格式: 1.A 2.B 3.C (选择题) | 4.答案文本 (简答题)');
    console.log('  填空多答案用分号分隔: 5.答案1;答案2');
})();
