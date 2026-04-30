import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const INITIAL_FORM = {
  species: "dog",
  name: "点点",
  ageStage: "senior",
  ageYears: "14",
  weight: "4.8",
  neutered: "yes",
  activity: "low",
  bcs: "5",
  mcs: "mild_loss",
  diet: "homemade",
  disease: "gallbladder",
  symptom: "none",
};

const FOOD_DATABASE = [
  { name: "鸡胸肉", dog: "可少量", cat: "可少量", risk: "低", note: "低脂蛋白来源，但不能作为长期单一主食。长期自制餐仍需平衡钙磷、维生素和微量元素。" },
  { name: "南瓜", dog: "可少量", cat: "可少量", risk: "低", note: "熟南瓜可作为少量纤维来源，适合帮助便便稳定，但不能代替主食。" },
  { name: "鸡蛋", dog: "可少量", cat: "可少量", risk: "低", note: "建议熟制后少量喂食。不能替代完整主食。" },
  { name: "葡萄", dog: "禁止", cat: "不建议", risk: "高", note: "狗食用后可能出现严重中毒风险，应避免。误食建议联系兽医。" },
  { name: "葡萄干", dog: "禁止", cat: "不建议", risk: "高", note: "狗食用后可能出现严重中毒风险，应避免。误食建议联系兽医。" },
  { name: "洋葱", dog: "禁止", cat: "禁止", risk: "高", note: "可能损伤红细胞，犬猫都应避免。" },
  { name: "大蒜", dog: "禁止", cat: "禁止", risk: "高", note: "可能损伤红细胞，犬猫都应避免。" },
  { name: "巧克力", dog: "禁止", cat: "禁止", risk: "高", note: "含甲基黄嘌呤类物质，犬猫都应避免。误食量较大时应尽快就医。" }
];

const KNOWLEDGE_CARDS = [
  {
    id: "senior_dog_protein",
    category: "老年宠物",
    question: "老年狗是不是要少吃肉？",
    answer: "不一定。老年犬更重要的是维持体重、肌肉量、消化吸收和慢性病风险管理。除非有肾病、肝病等需要特殊控制的疾病，否则不能简单理解为老年狗都应该低蛋白。",
    risk: "中",
    source: "WSAVA 营养评估逻辑 + FEDIAF 营养框架"
  },
  {
    id: "homemade_calcium",
    category: "自制鲜食",
    question: "自制餐为什么要补钙？",
    answer: "肉类通常磷高、钙低。长期只吃肉、蔬菜和米饭，容易出现钙磷比例不平衡。长期自制餐需要钙源和复合营养补充剂，并按配方计算。",
    risk: "中高",
    source: "FEDIAF 营养素完整性框架"
  },
  {
    id: "cat_chicken",
    category: "猫咪营养",
    question: "猫能长期只吃鸡胸肉吗？",
    answer: "不建议。猫是专性肉食动物，但鸡胸肉本身不是完整主食。长期单一喂鸡胸肉会有牛磺酸、钙磷、脂溶性维生素、必需脂肪酸和微量元素不足的风险。",
    risk: "中高",
    source: "FEDIAF 猫营养框架"
  },
  {
    id: "cat_no_eat",
    category: "高风险提醒",
    question: "猫不吃饭怎么办？",
    answer: "猫不吃饭需要谨慎。如果超过 24–48 小时不进食，或伴随精神差、呕吐、疼痛、黄疸等情况，建议尽快联系兽医。小程序只能提供风险提醒，不能替代诊断。",
    risk: "高",
    source: "临床安全规则"
  },
  {
    id: "soft_stool",
    category: "肠胃问题",
    question: "狗狗软便可以吃南瓜吗？",
    answer: "偶发软便时，少量熟南瓜可以作为纤维来源辅助观察。但如果持续腹泻、便血、呕吐、精神差，或者幼犬/老年犬出现明显异常，应优先就医。",
    risk: "中",
    source: "日常护理规则"
  },
  {
    id: "senior_weight_loss",
    category: "老年宠物",
    question: "老年宠物变瘦正常吗？",
    answer: "不建议直接当作正常衰老。老年宠物体重下降可能与牙齿、肠胃、肾脏、内分泌、疼痛、肿瘤或肌肉流失有关。建议记录体重变化，并做基础体检。",
    risk: "中高",
    source: "WSAVA BCS/MCS 评估逻辑"
  }
];

function calculateRER(weight) {
  const parsedWeight = Number(weight);
  if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) return 0;
  return Math.round(70 * Math.pow(parsedWeight, 0.75));
}

function getEnergyMultiplier(form) {
  let multiplier = form.species === "cat" ? 1.2 : 1.45;
  if (form.neutered === "yes") multiplier -= 0.1;
  if (form.activity === "low") multiplier -= 0.15;
  if (form.activity === "high") multiplier += 0.25;
  if (Number(form.bcs) >= 7) multiplier -= 0.25;
  if (Number(form.bcs) <= 3) multiplier += 0.2;
  if (form.ageStage === "senior") multiplier -= 0.05;
  return Math.max(multiplier, 0.9);
}

function getRiskTags(form) {
  const risks = [];
  const bcs = Number(form.bcs);
  if (form.ageStage === "senior") risks.push({ label: "老年阶段", level: "medium", text: "建议关注体重、肌肉量、食欲、饮水、便便和慢性病风险。" });
  if (form.mcs !== "normal") risks.push({ label: "肌肉量需关注", level: "medium", text: "老年宠物常见肌肉流失，建议定期记录体重和体态照片。" });
  if (bcs >= 7) risks.push({ label: "体况偏胖", level: "medium", text: "建议控制总热量，零食尽量不超过每日热量的 10%。" });
  if (bcs <= 3) risks.push({ label: "体况偏瘦", level: "high", text: "近期变瘦不建议只靠加餐解决，应优先排查疾病或疼痛。" });
  if (form.diet === "homemade") risks.push({ label: "自制餐营养完整性", level: "medium", text: "长期自制餐需要平衡钙磷、牛磺酸、维生素和微量元素。" });
  if (form.disease !== "none") risks.push({ label: "疾病饮食需谨慎", level: "high", text: "有疾病史时不建议使用通用配方，应结合兽医检查结果。" });
  if (["vomit", "diarrhea", "no_eat"].includes(form.symptom)) risks.push({ label: "近期症状风险", level: "high", text: "持续呕吐、腹泻、拒食或精神差，应尽快咨询兽医。" });
  return risks;
}

function getMealSuggestion(form, kcal) {
  const weight = Number(form.weight || 0);
  if (!weight || !kcal) return [];

  if (form.species === "cat") {
    return [
      { name: "动物蛋白主食", grams: Math.round(weight * 18), role: "猫更依赖动物性营养，建议选择完整主食或经审核鲜食配方。" },
      { name: "湿粮/加水鲜食", grams: "提高水分", role: "帮助增加水分摄入，适合日常泌尿健康管理。" },
      { name: "少量纤维来源", grams: Math.max(5, Math.round(weight * 2)), role: "可用少量熟南瓜泥等，帮助便便稳定。" },
      { name: "牛磺酸", grams: "需计算", role: "猫长期自制餐必须重点关注。" },
      { name: "钙源/复合营养补充剂", grams: "需计算", role: "用于平衡钙磷、维生素和微量元素。" }
    ];
  }

  const lowFat = form.disease === "pancreatitis" || form.disease === "gallbladder" || form.ageStage === "senior";
  return [
    { name: lowFat ? "熟鸡胸肉" : "熟鸡胸肉/瘦牛肉", grams: Math.round(kcal * 0.18), role: lowFat ? "低脂蛋白，适合消化负担较低的日常搭配。" : "优质蛋白，帮助维持肌肉。" },
    { name: "熟米饭/土豆/红薯", grams: Math.round(kcal * 0.1), role: "温和能量来源，帮助适口性。" },
    { name: "熟南瓜", grams: Math.round(kcal * 0.06), role: "纤维来源，帮助便便稳定。" },
    { name: "熟胡萝卜/西兰花", grams: Math.round(kcal * 0.03), role: "少量植物营养与口感变化。" },
    { name: "钙粉/复合营养补充剂", grams: "需计算", role: "长期自制餐必须补足矿物质和维生素。" }
  ];
}

function getFoodStatus(query) {
  const normalized = query.trim();
  if (!normalized) return null;
  return FOOD_DATABASE.find((item) => normalized.includes(item.name) || item.name.includes(normalized)) || {
    name: normalized,
    dog: "待确认",
    cat: "待确认",
    risk: "未知",
    note: "正式版会从食材安全数据库检索，并标注来源和审核状态。无法确认时，不应默认安全。"
  };
}

function searchKnowledge(question) {
  const q = question.trim();
  if (!q) return KNOWLEDGE_CARDS[0];
  if (q.includes("补钙") || q.includes("钙")) return KNOWLEDGE_CARDS.find((item) => item.id === "homemade_calcium");
  if (q.includes("鸡胸") || q.includes("鸡肉")) return KNOWLEDGE_CARDS.find((item) => item.id === "cat_chicken");
  if (q.includes("不吃") || q.includes("拒食")) return KNOWLEDGE_CARDS.find((item) => item.id === "cat_no_eat");
  if (q.includes("软便") || q.includes("拉稀") || q.includes("南瓜")) return KNOWLEDGE_CARDS.find((item) => item.id === "soft_stool");
  if (q.includes("变瘦") || q.includes("瘦")) return KNOWLEDGE_CARDS.find((item) => item.id === "senior_weight_loss");
  if (q.includes("老年") || q.includes("少吃肉") || q.includes("蛋白")) return KNOWLEDGE_CARDS.find((item) => item.id === "senior_dog_protein");

  return {
    id: "fallback",
    category: "通用答疑",
    question: q,
    answer: "正式版会先检索知识库，再结合宠物档案生成回答。涉及疾病、用药、持续呕吐腹泻、拒食、肾病、胰腺炎、糖尿病等情况时，系统会优先提示就医，而不是直接给处方。",
    risk: "待判断",
    source: "需要知识库检索与审核规则"
  };
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function TextInput({ value, onChange, type = "text", placeholder = "" }) {
  return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

function NativeSelect({ value, onChange, children }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

function Pill({ children, tone = "slate" }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function riskTone(risk) {
  if (risk === "高" || risk === "中高") return "red";
  if (risk === "中" || risk === "未知" || risk === "待判断") return "amber";
  return "green";
}

function StatCard({ label, value, sub, dark = false }) {
  return <div className={`stat ${dark ? "dark" : ""}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>;
}

function Header() {
  return <header className="hero">
    <div>
      <div className="eyebrow">Uppurr Health Intelligence Demo</div>
      <h1>宠物营养与健康答疑助手</h1>
      <p>更接近正式产品的小程序原型：宠物档案、营养风险筛查、克重搭配、食材安全、老年宠物知识库和 AI 答疑流程。</p>
    </div>
    <div className="hero-cards">
      <div>可信资料：WSAVA / FEDIAF / 后续 AAHA</div>
      <div>定位：日常照护建议，不替代兽医诊断</div>
    </div>
  </header>;
}

function ProfileForm({ form, update }) {
  return <section className="card">
    <div className="section-title"><div className="icon">🐾</div><div><h2>宠物档案</h2><p>正式版建议先让用户完成 60 秒档案填写，再进入评估和问答。</p></div></div>
    <div className="form-grid">
      <Field label="宠物名字"><TextInput value={form.name} onChange={(v) => update("name", v)} /></Field>
      <Field label="类型"><NativeSelect value={form.species} onChange={(v) => update("species", v)}><option value="dog">狗狗</option><option value="cat">猫咪</option></NativeSelect></Field>
      <Field label="年龄阶段"><NativeSelect value={form.ageStage} onChange={(v) => update("ageStage", v)}><option value="adult">成年</option><option value="senior">老年</option></NativeSelect></Field>
      <Field label="年龄"><TextInput type="number" value={form.ageYears} onChange={(v) => update("ageYears", v)} /></Field>
      <Field label="体重 kg"><TextInput type="number" value={form.weight} onChange={(v) => update("weight", v)} /></Field>
      <Field label="是否绝育"><NativeSelect value={form.neutered} onChange={(v) => update("neutered", v)}><option value="yes">已绝育</option><option value="no">未绝育</option></NativeSelect></Field>
      <Field label="活动量"><NativeSelect value={form.activity} onChange={(v) => update("activity", v)}><option value="low">低</option><option value="normal">普通</option><option value="high">高</option></NativeSelect></Field>
      <Field label="BCS 体况评分"><NativeSelect value={form.bcs} onChange={(v) => update("bcs", v)}><option value="3">3/9 偏瘦</option><option value="4">4/9 理想偏瘦</option><option value="5">5/9 理想</option><option value="6">6/9 微胖</option><option value="7">7/9 肥胖</option><option value="8">8/9 明显肥胖</option></NativeSelect></Field>
      <Field label="MCS 肌肉状态"><NativeSelect value={form.mcs} onChange={(v) => update("mcs", v)}><option value="normal">正常</option><option value="mild_loss">轻微流失</option><option value="moderate_loss">中度流失</option><option value="marked_loss">明显流失</option></NativeSelect></Field>
      <Field label="当前饮食"><NativeSelect value={form.diet} onChange={(v) => update("diet", v)}><option value="kibble">干粮为主</option><option value="wet">湿粮/罐头为主</option><option value="mixed">混合喂养</option><option value="homemade">自制餐</option></NativeSelect></Field>
      <Field label="健康情况"><NativeSelect value={form.disease} onChange={(v) => update("disease", v)}><option value="none">无明确疾病</option><option value="gallbladder">无胆囊/胆囊问题</option><option value="kidney">肾脏问题</option><option value="pancreatitis">胰腺炎史</option><option value="diabetes">糖尿病</option></NativeSelect></Field>
      <Field label="近期症状"><NativeSelect value={form.symptom} onChange={(v) => update("symptom", v)}><option value="none">无明显异常</option><option value="diarrhea">腹泻/软便</option><option value="vomit">呕吐</option><option value="no_eat">不吃饭/食欲明显下降</option></NativeSelect></Field>
    </div>
  </section>;
}

function Dashboard({ form, update, result }) {
  return <div className="dashboard">
    <ProfileForm form={form} update={update} />
    <div className="stack">
      <section className="card">
        <div className="section-title"><div className="icon">🩺</div><div><h2>营养风险筛查</h2><p>以 WSAVA 的筛查思路为基础：体重、BCS、MCS、饮食、疾病、症状共同判断。</p></div></div>
        <div className="stats">
          <StatCard label="RER 基础热量" value={result.rer} sub="kcal/天" />
          <StatCard label="状态调整系数" value={result.multiplier.toFixed(2)} sub="按状态调整" />
          <StatCard label="每日参考热量" value={result.kcal} sub="kcal/天" dark />
        </div>
        <div className="risk-list">
          {result.risks.map((risk) => <div className="risk" key={`${risk.label}-${risk.text}`}><div><b>{risk.label}</b><Pill tone={risk.level === "high" ? "red" : "amber"}>{risk.level === "high" ? "高风险" : "需关注"}</Pill></div><p>{risk.text}</p></div>)}
        </div>
      </section>

      <section className="card">
        <div className="section-title"><div className="icon">🍽️</div><div><h2>今日参考搭配</h2><p>当前是 Demo 级别的克重展示；正式版需要接入食材营养数据库和营养素校验。</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>食材/营养项</th><th>建议量</th><th>解释</th></tr></thead>
            <tbody>{result.meals.map((item) => <tr key={`${item.name}-${item.grams}`}><td>{item.name}</td><td>{typeof item.grams === "number" ? `${item.grams}g` : item.grams}</td><td>{item.role}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="warning">安全边界：这不是疾病处方，也不是长期完整配方。长期自制餐必须做钙磷、脂肪酸、维生素和微量元素校验，并建议由兽医营养专业人士审核。</div>
      </section>
    </div>
  </div>;
}

function QAPanel({ form }) {
  const [question, setQuestion] = useState("老年狗是不是要少吃肉？");
  const card = searchKnowledge(question);
  return <section className="card">
    <div className="section-title"><div className="icon">🤖</div><div><h2>AI 健康答疑 Demo</h2><p>正式版应使用“知识库检索 + 宠物档案 + 风险红线”，而不是让 AI 自由发挥。</p></div></div>
    <div className="search-row"><TextInput value={question} onChange={setQuestion} placeholder="例如：猫能长期只吃鸡胸肉吗？" /><button onClick={() => setQuestion(question.trim())}>生成建议</button></div>
    <div className="qa-grid">
      <div className="qa-side"><span>匹配知识卡片</span><h3>{card.category}</h3><p>{card.question}</p><div><Pill tone={riskTone(card.risk)}>风险：{card.risk}</Pill><Pill tone="blue">{form.species === "dog" ? "狗狗档案" : "猫咪档案"}</Pill></div></div>
      <div className="answer"><span>给用户的回答</span><p>{card.answer}</p><div>知识来源/依据：{card.source}</div></div>
    </div>
    <div className="quick-grid">{["自制餐为什么要补钙？", "猫能长期只吃鸡胸肉吗？", "老年宠物变瘦正常吗？"].map((q) => <button key={q} onClick={() => setQuestion(q)}>{q}</button>)}</div>
  </section>;
}

function FoodPanel({ form }) {
  const [foodQuery, setFoodQuery] = useState("巧克力");
  const food = getFoodStatus(foodQuery);
  return <section className="card">
    <div className="section-title"><div className="icon">🥕</div><div><h2>食材能不能吃</h2><p>适合作为小程序流量入口：用户每天都会查食材安全。</p></div></div>
    <div className="search-row"><TextInput value={foodQuery} onChange={setFoodQuery} placeholder="输入食材，例如：鸡胸肉、南瓜、葡萄、洋葱" /><button onClick={() => setFoodQuery(foodQuery.trim())}>查询</button></div>
    {food && <div className="food-grid">
      <div><span>食材</span><h3>{food.name}</h3><Pill tone={riskTone(food.risk)}>风险：{food.risk}</Pill></div>
      <div><span>狗狗</span><h3>{food.dog}</h3><p>{form.species === "dog" ? "当前正在查看狗狗" : "可切换为狗狗"}</p></div>
      <div><span>猫咪</span><h3>{food.cat}</h3><p>{form.species === "cat" ? "当前正在查看猫咪" : "可切换为猫咪"}</p></div>
      <div className="food-note"><span>解释</span><p>{food.note}</p></div>
    </div>}
  </section>;
}

function LibraryPanel() {
  return <div className="library-grid">
    <section className="card">
      <div className="section-title"><div className="icon">📚</div><div><h2>知识库结构</h2><p>正式版不是简单喂 PDF，而是把可信资料整理成结构化知识卡片。</p></div></div>
      <div className="knowledge-list">{KNOWLEDGE_CARDS.map((item) => <div key={item.id} className="knowledge-card"><div><Pill>{item.category}</Pill><Pill tone={riskTone(item.risk)}>风险：{item.risk}</Pill></div><h3>{item.question}</h3><p>{item.answer}</p></div>)}</div>
    </section>
    <section className="card">
      <div className="section-title"><div className="icon">🧱</div><div><h2>MVP 模块规划</h2><p>这部分可以直接变成小程序开发清单。</p></div></div>
      <div className="roadmap">{["宠物档案与多宠物管理", "营养风险筛查", "日常克重搭配建议", "食材能不能吃查询", "老年宠物照护知识库", "AI 问答与高风险拦截", "知识来源与审核状态展示", "后期接入食材包/营养补充剂/私域咨询"].map((item, idx) => <div key={item}><b>{idx + 1}</b><span>{item}</span></div>)}</div>
      <div className="business"><span>商业化入口</span><p>后续可以自然接入：老年宠物营养报告、月度照护计划、食材包、营养补充剂、专家咨询和私域社群。</p></div>
    </section>
  </div>;
}

function App() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState("dashboard");

  const result = useMemo(() => {
    const rer = calculateRER(Number(form.weight || 0));
    const multiplier = getEnergyMultiplier(form);
    const kcal = Math.round(rer * multiplier);
    return { rer, multiplier, kcal, risks: getRiskTags(form), meals: getMealSuggestion(form, kcal) };
  }, [form]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return <div className="app">
    <div className="container">
      <Header />
      <div className="layout">
        <aside>
          <div className="nav-title">功能导航</div>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>首页评估</button>
          <button className={activeTab === "qa" ? "active" : ""} onClick={() => setActiveTab("qa")}>AI 健康答疑</button>
          <button className={activeTab === "food" ? "active" : ""} onClick={() => setActiveTab("food")}>食材能不能吃</button>
          <button className={activeTab === "library" ? "active" : ""} onClick={() => setActiveTab("library")}>知识库与规划</button>
          <div className="pet-card"><span>当前宠物</span><b>{form.name || "未命名"}</b><p>{form.species === "dog" ? "狗狗" : "猫咪"} · {form.ageStage === "senior" ? "老年" : "成年"} · {form.weight}kg</p></div>
        </aside>
        <main>
          {activeTab === "dashboard" && <Dashboard form={form} update={update} result={result} />}
          {activeTab === "qa" && <QAPanel form={form} />}
          {activeTab === "food" && <FoodPanel form={form} />}
          {activeTab === "library" && <LibraryPanel />}
        </main>
      </div>
    </div>
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
