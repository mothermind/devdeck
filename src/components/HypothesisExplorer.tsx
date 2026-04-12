import { useState, useCallback } from 'react';

// ── Constants ────────────────────────────────────────────
const MODELS: Record<string, string> = {
  'mDeBERTa-v3 · 2.7M examples (production)': 'MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7',
  'mDeBERTa-v3 · MNLI+XNLI (lighter)': 'MoritzLaurer/mDeBERTa-v3-base-mnli-xnli',
};

type Lang = 'en' | 'ko';
type Hypothesis = [string, string]; // [label, text]

interface Group {
  name: string;
  key: string;
  hypotheses: Record<Lang, Hypothesis[]>;
}

const DEFAULT_GROUPS: Group[] = [
  {
    name: 'Overall Sentiment', key: 'sentiment',
    hypotheses: {
      en: [['positive','This review expresses a positive opinion'],['negative','This review expresses a negative opinion'],['neutral','This review expresses a neutral opinion']],
      ko: [['positive','이 리뷰는 긍정적인 의견을 표현합니다'],['negative','이 리뷰는 부정적인 의견을 표현합니다'],['neutral','이 리뷰는 중립적인 의견을 표현합니다']],
    },
  },
  {
    name: 'Satisfaction', key: 'satisfaction',
    hypotheses: {
      en: [['very','The customer is very satisfied with the product'],['somewhat','The customer is somewhat satisfied with the product'],['un','The customer is dissatisfied with the product']],
      ko: [['very','고객이 제품에 매우 만족합니다'],['somewhat','고객이 제품에 약간 만족합니다'],['un','고객이 제품에 불만족합니다']],
    },
  },
  {
    name: 'Aspect: Moisture', key: 'moisture',
    hypotheses: {
      en: [['positive','This product provides good moisture'],['negative','This product causes dryness'],['neutral','This product has average moisturizing effect']],
      ko: [['positive','이 제품은 촉촉함을 제공합니다'],['negative','이 제품은 건조함을 유발합니다'],['neutral','이 제품의 보습력은 보통입니다']],
    },
  },
  {
    name: 'Aspect: Effectiveness', key: 'effectiveness',
    hypotheses: {
      en: [['positive','This product is effective'],['negative','This product has no effect'],['neutral','This product has minimal effect']],
      ko: [['positive','이 제품은 효과가 좋습니다'],['negative','이 제품은 효과가 없습니다'],['neutral','이 제품의 효과는 미미합니다']],
    },
  },
  {
    name: 'Aspect: Texture', key: 'texture',
    hypotheses: {
      en: [['positive','The product texture is good'],['negative','The product texture is bad'],['neutral','The product texture is average']],
      ko: [['positive','제품의 텍스처가 좋습니다'],['negative','제품의 텍스처가 나쁩니다'],['neutral','제품의 텍스처는 보통입니다']],
    },
  },
  {
    name: 'Aspect: Absorption', key: 'absorption',
    hypotheses: {
      en: [['positive','The product absorbs well'],['negative','The product does not absorb well'],['neutral','The product has average absorption']],
      ko: [['positive','제품이 잘 흡수됩니다'],['negative','제품이 잘 흡수되지 않습니다'],['neutral','제품의 흡수력은 보통입니다']],
    },
  },
];

interface Sample { text: string; rating: number; label: string; }
const SAMPLES: Record<Lang, Sample[]> = {
  en: [
    { rating: 5, label: 'Sample A — positive, high satisfaction', text: 'It absorbs quickly and keeps skin moisturized for hours. The scent is subtle and gentle enough for sensitive skin. Will definitely repurchase!' },
    { rating: 2, label: 'Sample B — negative, low satisfaction',  text: 'Disappointed — the moisturizing effect is weak for the price and the texture is too heavy, making absorption really slow.' },
    { rating: 4, label: 'Sample C — delayed positive effect',      text: "Wasn't impressed at first but after a few weeks my skin has fewer breakouts and pores look smaller. Effects are gradual but real." },
    { rating: 1, label: 'Sample D — negative, skin reaction',     text: 'The scent is way too strong and caused an allergic reaction. The ingredients concern me and the irritation forced me to stop using it.' },
    { rating: 5, label: 'Sample E — positive texture & absorption', text: 'Lightweight and moisturizing — perfect for summer. Non-greasy, absorbs fast, using it every morning now.' },
    { rating: 3, label: 'Sample F — neutral, price concern',      text: "Just average. Nothing particularly bad or good. A bit pricey so I'm not sure about repurchasing." },
  ],
  ko: [
    { rating: 5, label: 'Sample A — 긍정, 높은 만족도', text: '피부에 잘 흡수되고 촉촉함이 오래 유지돼요. 향도 은은하고 자극없이 순해서 민감한 피부에도 좋을 것 같아요. 재구매 의사 있습니다!' },
    { rating: 2, label: 'Sample B — 부정, 낮은 만족도', text: '기대만큼 효과가 없어서 실망이에요. 가격 대비 보습력이 너무 부족하고 텍스처도 너무 무거워서 흡수가 잘 안됩니다.' },
    { rating: 4, label: 'Sample C — 지연된 긍정 효과',  text: '처음엔 별로였는데 쓰다보니 피부 트러블이 줄고 모공이 작아진 것 같아요. 효과는 천천히 나타나지만 확실히 있어요.' },
    { rating: 1, label: 'Sample D — 부정, 피부 반응',   text: '향이 너무 강해서 알레르기 반응이 나타났어요. 성분도 좀 걱정되고 피부에 자극이 심해서 사용을 중단했습니다.' },
    { rating: 5, label: 'Sample E — 긍정 텍스처 & 흡수', text: '촉촉하고 가벼워서 여름에 쓰기 딱 좋아요. 기름지지 않고 흡수도 빨라서 매일 아침 사용하고 있어요.' },
    { rating: 3, label: 'Sample F — 중립, 가격 우려',   text: '그냥 보통이에요. 특별히 나쁘지도 않고 좋지도 않아요. 가격이 좀 비싸서 재구매는 모르겠어요.' },
  ],
};

// ── Types ────────────────────────────────────────────────
type HypState = string[][]; // [groupIdx][hypIdx] = text
type ScoreEntry = { label: string; text: string; score: number };
type Results = Record<string, { name: string; scores: ScoreEntry[] }>;

function initHyps(lang: Lang): HypState {
  return DEFAULT_GROUPS.map(g => g.hypotheses[lang].map(([, text]) => text));
}

// ── HF API ───────────────────────────────────────────────
async function scoreGroup(
  modelId: string,
  premise: string,
  hypotheses: Hypothesis[],
): Promise<ScoreEntry[]> {
  const candidateLabels = hypotheses.map(([, text]) => text);
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, text: premise, candidateLabels }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `HTTP ${res.status}`);
  }
  const data = await res.json() as Array<{ label: string; score: number }>;
  const scoreMap: Record<string, number> = {};
  data.forEach(({ label, score }) => { scoreMap[label] = score; });
  return hypotheses.map(([label, text]) => ({
    label, text, score: Math.round((scoreMap[text] ?? 0) * 10000) / 10000,
  }));
}

// ── Sub-components ───────────────────────────────────────
function ScoreGroup({ name, scores }: { name: string; scores: ScoreEntry[] }) {
  const maxScore = Math.max(...scores.map(s => s.score));
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.63rem', color: 'var(--text-dim)', fontWeight: 400, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '0.3rem', marginTop: '1rem' }}>
        {name}
      </div>
      {scores.map(({ label, text, score }) => {
        const isMax = Math.abs(score - maxScore) < 1e-6;
        const pct = Math.round(score * 100);
        return (
          <div key={label} style={{ padding: '0.22rem 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: isMax ? 'var(--text)' : 'var(--text-muted)', width: 72, flexShrink: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: isMax ? 'var(--accent)' : 'var(--border)', borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '0.74rem', color: isMax ? 'var(--text)' : 'var(--text-dim)', width: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {score.toFixed(3)}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', width: 12, flexShrink: 0 }}>
                {isMax ? '★' : ''}
              </span>
            </div>
            <div style={{ fontSize: '0.63rem', color: 'var(--text-dim)', paddingLeft: 80, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────
export default function HypothesisExplorer() {
  const [lang, setLang]           = useState<Lang>('en');
  const [modelKey, setModelKey]   = useState(Object.keys(MODELS)[0]);
  const [source, setSource]       = useState<'sample' | 'type'>('sample');
  const [sampleIdx, setSampleIdx] = useState(0);
  const [customText, setCustomText] = useState('');
  const [hyps, setHyps]           = useState<HypState>(initHyps('en'));
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState<Results | null>(null);
  const [error, setError]         = useState('');

  const sample = SAMPLES[lang][sampleIdx] ?? SAMPLES[lang][0];
  const reviewText = source === 'sample' ? sample.text : customText;
  const modelId = MODELS[modelKey];

  function switchLang(l: Lang) {
    setLang(l);
    setHyps(initHyps(l));
    setSampleIdx(0);
    setResults(null);
    setError('');
  }

  function updateHyp(gIdx: number, hIdx: number, val: string) {
    setHyps(prev => prev.map((g, gi) => gi === gIdx ? g.map((h, hi) => hi === hIdx ? val : h) : g));
  }

  function toggleGroup(idx: number) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  const analyze = useCallback(async () => {
    if (!reviewText.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const out: Results = {};
      for (let gi = 0; gi < DEFAULT_GROUPS.length; gi++) {
        const group = DEFAULT_GROUPS[gi];
        const pairs: Hypothesis[] = group.hypotheses[lang].map(([label], hi) => [label, hyps[gi][hi]]);
        const scores = await scoreGroup(modelId, reviewText, pairs);
        out[group.key] = { name: group.name, scores };
      }
      setResults(out);
    } catch (e: any) {
      setError(e.message ?? 'API error');
    } finally {
      setLoading(false);
    }
  }, [reviewText, modelId, lang, hyps]);

  // ── CSS helpers ──
  const segBtn = (active: boolean) => ({
    padding: '0.25rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem',
    background: active ? 'var(--accent-bg)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    border: active ? '1px solid var(--accent)' : '1px solid transparent',
    fontFamily: 'var(--font-sans)',
  } as React.CSSProperties);

  const label = (txt: string) => (
    <div style={{ fontSize: '0.63rem', fontWeight: 400, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
      {txt}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
      {/* ── Controls ── */}
      <div>
        {/* Language */}
        <div style={{ marginBottom: '1rem' }}>
          {label('Language')}
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {(['en', 'ko'] as Lang[]).map(l => (
              <button key={l} style={segBtn(lang === l)} onClick={() => switchLang(l)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div style={{ marginBottom: '1rem' }}>
          {label('Model')}
          <select
            value={modelKey}
            onChange={e => setModelKey(e.target.value)}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
          >
            {Object.keys(MODELS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Review source toggle */}
        <div style={{ marginBottom: '0.6rem' }}>
          {label('Review')}
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
            {(['sample', 'type'] as const).map(s => (
              <button key={s} style={segBtn(source === s)} onClick={() => setSource(s)}>{s}</button>
            ))}
          </div>

          {source === 'sample' ? (
            <>
              <select
                value={sampleIdx}
                onChange={e => { setSampleIdx(+e.target.value); setResults(null); }}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.4rem 0.6rem', cursor: 'pointer', marginBottom: '0.5rem' }}
              >
                {SAMPLES[lang].map((s, i) => <option key={i} value={i}>{s.label}</option>)}
              </select>
              <div style={{ fontSize: '0.8rem', color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.6rem 0.75rem', lineHeight: 1.6, marginBottom: '0.3rem' }}>
                {sample.text}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                Rating: {'★'.repeat(sample.rating)}{'☆'.repeat(5 - sample.rating)} ({sample.rating}/5)
              </div>
            </>
          ) : (
            <textarea
              value={customText}
              onChange={e => { setCustomText(e.target.value); setResults(null); }}
              placeholder={lang === 'en' ? 'Paste any product review...' : '제품 리뷰를 붙여넣기 하세요...'}
              rows={5}
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.5rem 0.75rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
          )}
        </div>

        {/* Hypotheses */}
        <div style={{ marginBottom: '0.75rem', marginTop: '0.75rem' }}>
          {label('Hypotheses')}
          {DEFAULT_GROUPS.map((group, gi) => {
            const open = openGroups.has(gi);
            return (
              <div key={gi} style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: '0.4rem', overflow: 'hidden' }}>
                <button
                  onClick={() => toggleGroup(gi)}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.9rem', background: 'var(--surface)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, fontFamily: 'var(--font-sans)' }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
                  {group.name}
                </button>
                {open && (
                  <div style={{ padding: '0.75rem 0.9rem', borderTop: '1px solid var(--border)' }}>
                    {group.hypotheses[lang].map(([lbl], hi) => (
                      <div key={hi} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.2rem', fontFamily: 'var(--font-mono)' }}>{lbl}</div>
                        <input
                          type="text"
                          value={hyps[gi][hi]}
                          onChange={e => updateHyp(gi, hi, e.target.value)}
                          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '0.3rem 0.6rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={loading || !reviewText.trim()}
          style={{
            width: '100%', padding: '0.55rem', borderRadius: 6, border: 'none', cursor: loading || !reviewText.trim() ? 'not-allowed' : 'pointer',
            background: loading || !reviewText.trim() ? 'var(--border)' : 'var(--accent)',
            color: loading || !reviewText.trim() ? 'var(--text-dim)' : '#fff',
            fontSize: '0.88rem', fontWeight: 500, fontFamily: 'var(--font-sans)', transition: 'background 0.15s',
          }}
        >
          {loading ? 'Analyzing…' : 'Analyze →'}
        </button>
      </div>

      {/* ── Results ── */}
      <div>
        {error && (
          <div style={{ background: 'rgba(207,34,46,0.1)', border: '1px solid rgba(207,34,46,0.3)', borderRadius: 6, padding: '0.6rem 0.8rem', fontSize: '0.82rem', color: '#f85149', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', padding: '2rem 0', textAlign: 'center' }}>
            Scoring {DEFAULT_GROUPS.length * 3} hypothesis pairs…
          </div>
        )}

        {results && !loading && (
          Object.values(results).map(({ name, scores }) => (
            <ScoreGroup key={name} name={name} scores={scores} />
          ))
        )}

        {!results && !loading && !error && (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            ← select a review and click Analyze
          </div>
        )}
      </div>
    </div>
  );
}
