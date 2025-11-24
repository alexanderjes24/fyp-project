import React, { useState, useCallback } from 'react';
import { ChevronRight, Heart, Zap, Sunrise, Users } from 'lucide-react';
import { auth } from '../firebaseClient'; // ✅ Adjust to your project

// ------------------ Interfaces ------------------
interface QuizAnswer {
  questionId: number;
  answerValue: string | number | string[];
}

interface QuizStep {
  id: number;
  question: string;
  description?: string;
  type?: 'options' | 'slider' | 'text';
  options?: { label: string; value: string }[];
}

interface PreRegistrationQuizProps {
  onQuizComplete: (answers: QuizAnswer[]) => void;
}

// ------------------ Quiz Steps ------------------
const quizSteps: QuizStep[] = [
  { 
    id: 1, 
    question: "What is your primary reason for seeking counseling?", 
    type: "options",
    options: [
      { label: "Stress & Anxiety", value: "anxiety" },
      { label: "Relationship Issues", value: "relationship" },
      { label: "Depression", value: "depression" },
      { label: "Grief or Loss", value: "grief" },
    ]
  },
  { 
    id: 2, 
    question: "How would you rate your current emotional well-being?", 
    type: "slider" 
  },
  { 
    id: 3, 
    question: "Have you been in therapy before?", 
    type: "options",
    options: [
      { label: "Yes, recently", value: "yes-recent" },
      { label: "Yes, long ago", value: "yes-old" },
      { label: "No, this is new to me", value: "no" },
    ]
  },
  { 
    id: 4, 
    question: "What gender and age range would you prefer for your therapist?", 
    type: "text"
  },
  { 
    id: 5, 
    question: "Do you accept the confidentiality notice?",
    description: "Your answers are confidential and used only to match you with the right therapist.",
    type: "options",
    options: [
      { label: "Accept", value: "accept" },

    ]
  },
];

// ------------------ Component ------------------
const PreRegistrationQuiz: React.FC<PreRegistrationQuizProps> = ({ onQuizComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentAnswerValue, setCurrentAnswerValue] = useState<string | number | string[]>('');


  const currentQuizStep = quizSteps[currentStep];

  const handleAnswerChange = (value: string | number) => {
    setCurrentAnswerValue(value);
  };

  // ------------------ NEXT BUTTON ------------------
  const handleNext = useCallback(async () => {
    const newAnswer: QuizAnswer = {
      questionId: currentQuizStep.id,
      answerValue: currentAnswerValue,
    };

    const updatedAnswers = answers.filter(a => a.questionId !== newAnswer.questionId);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);

    if (currentStep < quizSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Preload previous answer or default
      const nextAnswer = updatedAnswers.find(a => a.questionId === quizSteps[nextStep].id);
      setCurrentAnswerValue(
        nextAnswer
          ? nextAnswer.answerValue
          : quizSteps[nextStep].type === 'slider' ? 5 : ''
      );
      return;
    }

    // ------------------ FINAL STEP → Save to Backend ------------------
    try {
      const user = auth.currentUser;

      // If user is NOT logged in → redirect to register/login
      if (!user) {
        alert("Please create an account to continue.");
        window.location.href = "/login";
        return;
      }

      // User IS logged in → continue saving quiz
      const token = await user.getIdToken();

      const res = await fetch("http://localhost:3000/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          answers: updatedAnswers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend error:", data);
        alert("Failed to save quiz: " + data.error);
        return;
      }

      // Quiz saved → move to next stage
      onQuizComplete(updatedAnswers);

    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Something went wrong submitting the quiz.");
    }

  }, [currentStep, currentAnswerValue, answers, currentQuizStep, onQuizComplete]);

  // ------------------ BACK BUTTON ------------------
  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      const prevAnswer = answers.find(a => a.questionId === quizSteps[prevStep].id);
      setCurrentAnswerValue(
        prevAnswer
          ? prevAnswer.answerValue
          : quizSteps[prevStep].type === 'slider' ? 5 : ''
      );
    }
  };

  // ------------------ Render Step UI ------------------
  const renderStepContent = () => {
    switch (currentQuizStep.type) {
      case 'options':
        return (
          <div className="space-y-4">
            {currentQuizStep.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswerChange(option.value)}
                className={`w-full text-left p-2 rounded-xl border-2 transition-all duration-200 shadow-sm
                  ${currentAnswerValue === option.value 
                    ? 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-300 transform scale-[1.02]' 
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
              >
                <div className="flex items-center">
                  {option.value === 'anxiety' && <Zap className="w-5 h-5 mr-3" />}
                  {option.value === 'depression' && <Heart className="w-5 h-5 mr-3" />}
                  {option.value === 'grief' && <Sunrise className="w-5 h-5 mr-3" />}
                  {option.value === 'relationship' && <Users className="w-5 h-5 mr-3" />}
                  <span className="font-semibold">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={currentAnswerValue as number || 5}
              onChange={(e) => handleAnswerChange(Number(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer range-lg focus:ring-2 focus:ring-blue-500"
              style={{ accentColor: '#3b82f6' }}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>1 - Very Low</span>
              <span className="font-bold text-blue-600">{currentAnswerValue || 5} / 10</span>
              <span>10 - Excellent</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={currentAnswerValue}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your preferences for your therapist..."
            rows={4}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
          />
        );

      default:
        return <p className="text-red-500">Unknown step type</p>;
    }
  };

  // ------------------ UI Elements ------------------
  const progress = ((currentStep + 1) / quizSteps.length) * 100;
  const isFinalStep = currentStep === quizSteps.length - 1;
  const isAnswered = currentAnswerValue !== '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
  <div className="w-full max-w-xl p-4 sm:p-4">

    {/* Progress Bar */}
    <div className="mb-6 pt-15">
      <p className="text-xs font-medium text-blue-600 mb-1">
        Step {currentStep + 1} of {quizSteps.length}
      </p>
      <div className="w-full h-1.5 bg-blue-200 rounded-full">
        <div
          className="h-1.5 bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>

    {/* Quiz Card */}
    <div className="p-5 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h1 className="text-2xl font-bold text-blue-800 mb-5 leading-snug">
        {currentQuizStep.question}
      </h1>
      {currentQuizStep.description && (
        <p className="text-gray-600 text-sm mb-4">
          {currentQuizStep.description}
        </p>
      )}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`py-2.5 px-5 rounded-full text-sm font-semibold border-2 transition 
            ${currentStep === 0
              ? 'text-gray-400 border-gray-200 cursor-not-allowed'
              : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className={`flex items-center py-2.5 px-5 rounded-full text-sm font-bold shadow-md transition
            ${isAnswered
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {isFinalStep ? "Find Your Match" : "Next"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  </div>
</div>

  );
};

export default PreRegistrationQuiz;
