import { Link } from 'react-router-dom';

type UnderConstructionProps = {
  title: string;
  description: string;
};

export default function UnderConstruction({ title, description }: UnderConstructionProps) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f1f8f6' }}>
      <section style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #dbe7e4' }}>
        <h1 style={{ marginTop: 0, marginBottom: '12px' }}>{title}</h1>
        <p style={{ marginTop: 0, marginBottom: '20px', color: '#384342', lineHeight: 1.6 }}>{description}</p>
        <Link to="/homepage" style={{ color: '#0b5fff', fontWeight: 700 }}>Voltar para Home</Link>
      </section>
    </main>
  );
}
