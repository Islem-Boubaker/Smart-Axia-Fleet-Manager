import DELIVERY_IMG from '../../../assets/Delivery.png';

export default function SigninHeroPanel() {
  return (
    <div
      className="sa-left"
      style={{
        position: 'relative',
        flex: '1.15',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#0c1018',
      }}
    >
      <img
        src={DELIVERY_IMG}
        alt="Delivery team loading packages"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'linear-gradient(to bottom,',
            '  rgba(8,11,20,0.55)  0%,',
            '  rgba(8,11,20,0.20) 28%,',
            '  rgba(8,11,20,0.30) 52%,',
            '  rgba(8,11,20,0.72) 72%,',
            '  rgba(6,8,16,0.94)  100%',
            ')',
          ].join(''),
        }}
      />

      <div
        className="sa-logo-block"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '40px 48px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              background: 'linear-gradient(135deg,#2F2FE4,#2F2FE4)',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 13l4-5 3 3 3-4 4 6H3z" fill="white" opacity="0.95" />
              <circle cx="15" cy="5" r="2.5" fill="white" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.01em',
            }}
          >
            Smart<span style={{ color: '#2F2FE4' }}>AXIA</span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: '100px',
            padding: '7px 16px',
            width: 'fit-content',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#4ade80',
              flexShrink: 0,
              animation: 'pulseDot 2s infinite',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.90)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em' }}>
            Live Fleet Tracking
          </span>
        </div>

        <div className="sa-title-block">
          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 'clamp(32px, 3.6vw, 52px)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              textShadow: '0 2px 24px rgba(0,0,0,0.4)',
            }}
          >
            Smart <span style={{ color: '#2F2FE4' }}>AXIA</span>
            <br />
            <span style={{ color: '#fff' }}>Fleet Manager</span>
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,0.78)',
              fontSize: '14.5px',
              lineHeight: 1.72,
              maxWidth: '380px',
            }}
          >
            Full visibility over your deliveries — real-time GPS, driver status, and dispatch from one unified control room.
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}
