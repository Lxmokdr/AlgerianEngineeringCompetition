'use client'
import { useState } from "react";
import toast from "react-hot-toast";
import PersonalInfoForm from "./persoForm";
import { FormState } from "./types";
import { supabase } from "../lib/supabaseClient";

const initialFormState: FormState = {
  full_name: "",
  email: "",
  university: "",
  linkedin: "",
  discord_id: "",
  year_of_study: "",
  phone: "",
  national_id: "",
  study_field: "",
  skills: "",
  team_name: "",
  hypscb: "",
  elaborate: "",
  experience: "",
  software: "",
};

const Reg = () => {
  const [step, setStep] = useState<"choice" | "teamSize" | "form">("choice");
  const [isSolo, setIsSolo] = useState<boolean | null>(null);
  const [numMembers, setNumMembers] = useState<number>(1);
  const [formStates, setFormStates] = useState<FormState[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);


  const handleChoice = (choice: "solo" | "team") => {
    if (choice === "solo") {
      setIsSolo(true);
      setFormStates([{ ...initialFormState }]);
      setStep("form");
      toast.success("Solo registration selected");
    } else {
      setIsSolo(false);
      setStep("teamSize");
      toast.success("Team registration selected");
    }
  };

  const handleTeamSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numMembers > 1) {
      setFormStates(Array.from({ length: numMembers }, () => ({ ...initialFormState })));
      setStep("form");
      toast.success(`${numMembers} team members set`);
    } else {
      toast.error("Team must have at least 2 members");
    }
  };

  const handleSaveData = (newData: FormState, idx: number) => {
    const updatedStates = [...formStates];
    updatedStates[idx] = newData;
    setFormStates(updatedStates);
  };

  const handleSoloSubmit = async (data: FormState) => {
    // Check if required fields are filled
    if (
      !data.full_name ||
      !data.email ||
      !data.university ||
      !data.linkedin ||
      !data.discord_id ||
      !data.phone ||
      !data.national_id ||
      !data.study_field
    ) {
      toast.error("Please fill in all the required fields!");
      return;
    }
  
    toast.loading("Submitting solo data...");
    try {
      // Insert solo member (no team)
      const { error } = await supabase.from("members").insert([{
        full_name: data.full_name,
        email: data.email,
        university: data.university,
        linkedin: data.linkedin,
        discord_id: data.discord_id,
        phone: data.phone,
        national_id: data.national_id,
        study_field: data.study_field,
        skills: data.skills,
        hypscb: data.hypscb,
        elaborate: data.elaborate,
        experience: data.experience,
        software: data.software,
        // No team_id
      }]);
  
      if (error) {
        toast.dismiss();
        toast.error("Failed to submit member.");
        return;
      }
  
      toast.dismiss();
      toast.success("Solo registration submitted!");
    } catch (error) {
      toast.dismiss();
      toast.error("Submission failed.");
      console.error(error);
    }
  };
  
  
  const handleFinalSubmit = async () => {
    if (formStates.length === 0) return toast.error("No team members data.");
  
    const teamName = formStates[0].team_name;
    if (!teamName) return toast.error("Team name is required!");
  
    // Check if required fields are filled for all members
    for (const member of formStates) {
      if (!member.full_name || !member.email || !member.university || !member.linkedin || !member.discord_id || !member.phone || !member.national_id || !member.study_field) {
        return toast.error("Please fill in all the required fields!");
      }
    }
  
    // Check if team already exists
    const { data: existingTeam, error: existingTeamError } = await supabase
      .from("teams")
      .select("id")
      .eq("team_name", teamName)
      .single();
  
    if (existingTeamError && existingTeamError.code !== "PGRST116") {  // PGRST116 is the code for "no rows found"
      toast.error("Failed to check existing team.");
      return;
    }
  
    if (existingTeam) {
      toast.error("A team with this name already exists.");
      return;
    }
  
    toast.loading("Submitting team data...");
  
    // Insert the team first
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({ team_name: teamName })
      .select()
      .single();
  
    if (teamError || !teamData) {
      toast.dismiss();
      toast.error("Failed to create team.");
      console.error(teamError);
      return;
    }
  
    const team_id = teamData.id;
    setTeamId(team_id);
  
    const membersToInsert = formStates.map((member) => ({
      full_name: member.full_name,
      email: member.email,
      university: member.university,
      linkedin: member.linkedin,
      discord_id: member.discord_id,
      phone: member.phone,
      national_id: member.national_id,
      study_field: member.study_field,
      skills: member.skills,
      hypscb: member.hypscb,
      elaborate: member.elaborate,
      experience: member.experience,
      software: member.software,
      team_id, // ✅ use team_id only
    }));
  
    const { error: membersError } = await supabase.from("members").insert(membersToInsert);
  
    toast.dismiss();
  
    if (membersError) {
      console.error(membersError);
      toast.error("Failed to submit members.");
    } else {
      toast.success("Team registered successfully!");
    }
  };
  
  

  const sections = formStates.map((_, i) =>
    isSolo ? "Member" : i === 0 ? "Leader" : `Member ${i}`
  );
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-3xl mx-auto">
        {step === "choice" && (
          <div className="space-y-4 text-center">
            <h2 className="aec text-white text-xl font-bold">Register as:</h2>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => handleChoice("solo")}
                className="bg-[#FFC200] text-[#110038] px-4 py-2 rounded hover:bg-[#110038] hover:text-[#FFC200]"
              >
                Solo
              </button>
              <button
                onClick={() => handleChoice("team")}
                className="bg-[#FFC200] text-[#110038] px-4 py-2 rounded hover:bg-[#110038] hover:text-[#FFC200]"
              >
                Team
              </button>
            </div>
          </div>
        )}
  
        {step === "teamSize" && (
          <form onSubmit={handleTeamSizeSubmit} className="space-y-6 text-center mt-6">
            <h2 className="text-xl font-bold text-white">Select number of team members:</h2>
            <div className="flex justify-center gap-4">
              {[2, 3, 4].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setNumMembers(num)}
                  className={`px-6 py-3 rounded-full font-semibold transition ${
                    numMembers === num
                      ? "bg-white text-[#110038]"
                      : "bg-[#FFC200] text-[#110038] hover:bg-[#110038] hover:text-[#FFC200]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="mt-4 bg-[#FFC200] text-[#110038] px-6 py-2 rounded hover:bg-[#110038] hover:text-[#FFC200] font-semibold"
            >
              Continue
            </button>
          </form>
        )}
  
        {step === "form" && (
          <div className="mt-6 space-y-4">
            <div className="max-w-2xl mx-auto">
              <PersonalInfoForm
                key={currentFormIndex}
                title={sections[currentFormIndex]}
                isLastForm={isSolo ? true : currentFormIndex === sections.length - 1}
                onSubmit={
                  isSolo
                    ? () => handleSoloSubmit(formStates[0])
                    : () => handleFinalSubmit()
                }
                formData={formStates[currentFormIndex]}
                setFormData={(newData: FormState) =>
                  handleSaveData(newData, currentFormIndex)
                }
                teamId={teamId}
                setTeamId={setTeamId}
                isSolo={isSolo}
              />
            </div>
  
            {/* Navigation buttons */}
            <div className="flex justify-between max-w-2xl mx-auto pt-4">
              <button
                type="button"
                disabled={currentFormIndex === 0}
                onClick={() => setCurrentFormIndex((prev) => prev - 1)}
                className={`px-4 py-2 rounded font-semibold transition ${
                  currentFormIndex === 0
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-[#FFC200] text-[#110038] hover:bg-[#110038] hover:text-[#FFC200]"
                }`}
              >
                Previous
              </button>
  
              {!isSolo && currentFormIndex < sections.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentFormIndex((prev) => prev + 1)}
                  className="bg-[#FFC200] text-[#110038] px-4 py-2 rounded hover:bg-[#110038] hover:text-[#FFC200] font-semibold"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
};

export default Reg;
