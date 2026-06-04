import React, { useState } from 'react';

interface StepData {
  personal: { name: string; email: string; phone: string; title: string };
  experience: Array<{ title: string; company: string; dates: string; description: string }>;
  education: Array<{ degree: string; institution: string; dates: string }>;
  skills: string[];
}

export const BuilderWizard: React.FC<{ userId: string; onComplete: () => void }> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<StepData>({
    personal: { name: '', email: '', phone: '', title: '' },
    experience: [],
    education: [],
    skills: [],
  });

  const steps = ['Personal Info', 'Work Experience', 'Education', 'Skills'];

  const saveSection = async (sectionType: string, content: string) => {
    await fetch('/api/cv/master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, section_type: sectionType, content }),
    });
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleComplete = async () => {
    // Save all data
    await saveSection('personal_name', data.personal.name);
    await saveSection('personal_email', data.personal.email);
    await saveSection('personal_phone', data.personal.phone);
    await saveSection('personal_title', data.personal.title);
    data.experience.forEach((exp, i) => saveSection(`experience_${i}`, `${exp.title} at ${exp.company} (${exp.dates}): ${exp.description}`));
    data.education.forEach((edu, i) => saveSection(`education_${i}`, `${edu.degree} from ${edu.institution} (${edu.dates})`));
    data.skills.forEach((skill, i) => saveSection(`skill_${i}`, skill));
    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <input placeholder="Full Name" value={data.personal.name} onChange={(e) => setData({...data, personal: {...data.personal, name: e.target.value}})} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400" />
            <input placeholder="Email" value={data.personal.email} onChange={(e) => setData({...data, personal: {...data.personal, email: e.target.value}})} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400" />
            <input placeholder="Phone" value={data.personal.phone} onChange={(e) => setData({...data, personal: {...data.personal, phone: e.target.value}})} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400" />
            <input placeholder="Professional Title" value={data.personal.title} onChange={(e) => setData({...data, personal: {...data.personal, title: e.target.value}})} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400" />
            <button onClick={nextStep} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-all">Next: Experience</button>
          </div>
        );
      case 2:
        return (
          <div>
            <p className="text-gray-300 mb-4">Add experiences (simplified - add one for demo)</p>
            <input placeholder="Job Title" className="w-full p-3 rounded-xl bg-white/10 mb-2" />
            <input placeholder="Company" className="w-full p-3 rounded-xl bg-white/10 mb-2" />
            <input placeholder="Dates (e.g. 2020-2023)" className="w-full p-3 rounded-xl bg-white/10 mb-2" />
            <textarea placeholder="Description" className="w-full p-3 rounded-xl bg-white/10 text-white h-24 mb-4" />
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 bg-gray-500/50 text-white py-2 rounded-xl">Back</button>
              <button onClick={nextStep} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-xl font-semibold">Next: Education</button>
            </div>
          </div>
        );
      // Similar for case 3, 4...
      default:
        return (
          <div className="space-y-4">
            <input placeholder="Add skill (comma separated)" onChange={(e) => setData({...data, skills: e.target.value.split(',')})} className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400" />
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 bg-gray-500/50 text-white py-3 rounded-xl">Back</button>
              <button onClick={handleComplete} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-all">Complete & Save to MasterCV</button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="glass rounded-3xl p-8 max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Builder Wizard</h2>
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-blue-500 text-white' : 'bg-white/20 text-gray-400'}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      {renderStep()}
    </div>
  );
};