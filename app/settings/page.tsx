import Tab from "@/components/settings/Tab";
import React from "react";

const Settings = () => {
  const options = [
    {
      name: "Account Details",
      icon: "AccountPerson.png",
    },
    {
      name: "API Details",
      icon: "ApiPerson.png",
    },
    // {
    //   name: "Privacy",
    //   icon: "PrivacyPerson.png",
    // },
    // {
    //   name: "Preference",
    //   icon: "PreferencePerson.png",
    // },
  ];

  return (
    <div className="w-full max-w-2xl flex-wrap mx-auto">
      <div
        className="flex gap-10 
        text-sm font-archivo font-semibold text-black  m-10"
      >
        {options.map((option, index) => (
          <Tab key={index} name={option.name} icon={option.icon} />
        ))}
      </div>
    </div>
  );
};

export default Settings;
