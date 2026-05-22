import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import blueDoctorAvatar from '../../../assets/avatar/blue/doctor.png';
import blueFootballAvatar from '../../../assets/avatar/blue/football.png';
import blueNudeAvatar from '../../../assets/avatar/blue/nude.png';
import blueProgrammerAvatar from '../../../assets/avatar/blue/programmer.png';
import blueTennisAvatar from '../../../assets/avatar/blue/tennis.png';
import greenDoctorAvatar from '../../../assets/avatar/green/doctor.png';
import greenFootballAvatar from '../../../assets/avatar/green/football.png';
import greenNudeAvatar from '../../../assets/avatar/green/nude.png';
import greenProgrammerAvatar from '../../../assets/avatar/green/programmer.png';
import greenTennisAvatar from '../../../assets/avatar/green/tennis.png';
import redDoctorAvatar from '../../../assets/avatar/red/doctor.png';
import redFootballAvatar from '../../../assets/avatar/red/football.png';
import redNudeAvatar from '../../../assets/avatar/red/nude.png';
import redProgrammerAvatar from '../../../assets/avatar/red/programmer.png';
import redTennisAvatar from '../../../assets/avatar/red/tennis.png';
import yellowNudeAvatar from '../../../assets/avatar/yellow/nude.png';
import yellowDoctorSpecialAvatar from '../../../assets/avatar/yellow/doctor.png';
import yellowFootballAvatar from '../../../assets/avatar/yellow/football.png';
import yellowProgrammerAvatar from '../../../assets/avatar/yellow/programmer.png';
import yellowTennisAvatar from '../../../assets/avatar/yellow/tennis.png';
import yellowLabCoatAvatar from '../../../assets/avatar/yellow/yellow-lab-coat.png';
import yellowLabCoatGlassesAvatar from '../../../assets/avatar/yellow/yellow-lab-coat-glasses.png';
import yellowLabCoatStethoscopeAvatar from '../../../assets/avatar/yellow/yellow-lab-coat-stethoscope.png';
import yellowSweatshirtAvatar from '../../../assets/avatar/yellow/yellow-sweatshirt.png';
import yellowSweatshirtGlassesAvatar from '../../../assets/avatar/yellow/yellow-sweatshirt-glasses.png';
import yellowSweatshirtStethoscopeAvatar from '../../../assets/avatar/yellow/yellow-sweatshirt-stethoscope.png';
import yellowTShirtAvatar from '../../../assets/avatar/yellow/yellow-t-shirt.png';
import yellowTShirtGlassesAvatar from '../../../assets/avatar/yellow/yellow-t-shirt-glasses.png';
import yellowTShirtStethoscopeAvatar from '../../../assets/avatar/yellow/yellow-t-shirt-stethoscope.png';
import './YellowAvatarTestPage.css';

const yellowAvatars = [
  ['Nude', yellowNudeAvatar],
  ['Lab coat', yellowLabCoatAvatar],
  ['Lab coat + glasses', yellowLabCoatGlassesAvatar],
  ['Lab coat + stethoscope', yellowLabCoatStethoscopeAvatar],
  ['Sweatshirt', yellowSweatshirtAvatar],
  ['Sweatshirt + glasses', yellowSweatshirtGlassesAvatar],
  ['Sweatshirt + stethoscope', yellowSweatshirtStethoscopeAvatar],
  ['T-shirt', yellowTShirtAvatar],
  ['T-shirt + glasses', yellowTShirtGlassesAvatar],
  ['T-shirt + stethoscope', yellowTShirtStethoscopeAvatar]
] as const;

const specialAvatars = [
  ['Green nude', greenNudeAvatar],
  ['Green football', greenFootballAvatar],
  ['Green programmer', greenProgrammerAvatar],
  ['Green doctor', greenDoctorAvatar],
  ['Green tennis', greenTennisAvatar],
  ['Blue nude', blueNudeAvatar],
  ['Blue football', blueFootballAvatar],
  ['Blue programmer', blueProgrammerAvatar],
  ['Blue doctor', blueDoctorAvatar],
  ['Blue tennis', blueTennisAvatar],
  ['Yellow football', yellowFootballAvatar],
  ['Yellow programmer', yellowProgrammerAvatar],
  ['Yellow doctor', yellowDoctorSpecialAvatar],
  ['Yellow tennis', yellowTennisAvatar],
  ['Red nude', redNudeAvatar],
  ['Red football', redFootballAvatar],
  ['Red programmer', redProgrammerAvatar],
  ['Red doctor', redDoctorAvatar],
  ['Red tennis', redTennisAvatar]
] as const;

export default function YellowAvatarTestPage() {
  const navigate = useNavigate();

  return (
    <main className="yellow-avatar-test-page">
      <header className="yellow-avatar-test-header">
        <button type="button" className="yellow-avatar-test-back" onClick={() => navigate('/avatar')} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p>Avatar test</p>
          <h1>Avatar assets</h1>
        </div>
      </header>

      <section className="yellow-avatar-test-grid" aria-label="Avatar asset combinations">
        {yellowAvatars.map(([label, image]) => (
          <article className="yellow-avatar-test-card" key={label}>
            <img src={image} alt={label} />
            <span>{label}</span>
          </article>
        ))}
        {specialAvatars.map(([label, image]) => (
          <article className="yellow-avatar-test-card" key={label}>
            <img src={image} alt={label} />
            <span>{label}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
