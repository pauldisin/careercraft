import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Check, Sparkles, BookOpen, ChevronDown, Award, Trash2 } from 'lucide-react';
import { skillsDatabase, universalSkills, getRecommendedSkillsByTitle, JobRoleSkills } from '../data/skillsDatabase';

interface SkillSuggestionsProps {
  currentSkills: string;
  onChange: (updatedSkills: string) => void;
  userJobTitle?: string;
}

export default function SkillSuggestions({ 
  currentSkills, 
  onChange, 
  userJobTitle = '' 
}: SkillSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Parse active skills from the string
  const activeSkillsList = useMemo(() => {
    return currentSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [currentSkills]);

  const activeSkillsSet = useMemo(() => {
    return new Set(activeSkillsList.map(s => s.toLowerCase()));
  }, [activeSkillsList]);

  // Find recommendations based on user's entered job title
  const detectedRoles = useMemo(() => {
    if (!userJobTitle) return [];
    return getRecommendedSkillsByTitle(userJobTitle);
  }, [userJobTitle]);

  // Unique categories list
  const categories = useMemo(() => {
    const list = new Set(skillsDatabase.map(role => role.category));
    return ['All', 'Recommended', ...Array.from(list), 'Soft Skills', 'Universal Tools'];
  }, []);

  // Filter skills and roles based on selection and search query
  const displayedSkills = useMemo(() => {
    let resultSkills: Array<{ name: string; source: string }> = [];

    // 1. Search Query active
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      // Search inside roles and direct skills
      skillsDatabase.forEach(role => {
        if (role.title.toLowerCase().includes(q) || role.category.toLowerCase().includes(q)) {
          role.skills.forEach(skill => {
            if (!resultSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
              resultSkills.push({ name: skill, source: role.title });
            }
          });
        } else {
          role.skills.forEach(skill => {
            if (skill.toLowerCase().includes(q) && !resultSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
              resultSkills.push({ name: skill, source: role.title });
            }
          });
        }
      });

      // Search soft/universal skills
      universalSkills["Soft Skills"].forEach(skill => {
        if (skill.toLowerCase().includes(q) && !resultSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
          resultSkills.push({ name: skill, source: "Soft Skills" });
        }
      });
      universalSkills["Administrative / Tooling"].forEach(skill => {
        if (skill.toLowerCase().includes(q) && !resultSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
          resultSkills.push({ name: skill, source: "Universal Tools" });
        }
      });

      return resultSkills.slice(0, 30); // Limiter for responsiveness
    }

    // 2. Tab/Category-based filter
    if (selectedCategory === 'All') {
      // Return a balanced mix of popular roles' skills
      skillsDatabase.slice(0, 6).forEach(role => {
        role.skills.forEach(skill => {
          if (!resultSkills.some(s => s.name === skill)) {
            resultSkills.push({ name: skill, source: role.title });
          }
        });
      });
    } else if (selectedCategory === 'Recommended') {
      if (detectedRoles.length > 0) {
        detectedRoles.forEach(role => {
          role.skills.forEach(skill => {
            if (!resultSkills.some(s => s.name === skill)) {
              resultSkills.push({ name: skill, source: role.title });
            }
          });
        });
      } else {
        // Fallback to software developer if none detected yet
        const defaultRole = skillsDatabase[0];
        defaultRole.skills.forEach(skill => {
          resultSkills.push({ name: skill, source: defaultRole.title });
        });
      }
    } else if (selectedCategory === 'Soft Skills') {
      universalSkills["Soft Skills"].forEach(skill => {
        resultSkills.push({ name: skill, source: "Soft Skills" });
      });
    } else if (selectedCategory === 'Universal Tools') {
      universalSkills["Administrative / Tooling"].forEach(skill => {
        resultSkills.push({ name: skill, source: "Universal Tools" });
      });
    } else {
      // Filter by industry category
      skillsDatabase
        .filter(role => role.category === selectedCategory)
        .forEach(role => {
          role.skills.forEach(skill => {
            if (!resultSkills.some(s => s.name === skill)) {
              resultSkills.push({ name: skill, source: role.title });
            }
          });
        });
    }

    return resultSkills;
  }, [selectedCategory, searchQuery, detectedRoles]);

  // Adjust pre-selected tabs on load if a matching role is detected
  useEffect(() => {
    if (detectedRoles.length > 0) {
      setSelectedCategory('Recommended');
    }
  }, [detectedRoles.length]);

  const toggleSkill = (skillName: string) => {
    const isSelected = activeSkillsSet.has(skillName.toLowerCase());
    let newSkillsList: string[];

    if (isSelected) {
      // Remove
      newSkillsList = activeSkillsList.filter(s => s.toLowerCase() !== skillName.toLowerCase());
    } else {
      // Add
      newSkillsList = [...activeSkillsList, skillName];
    }

    // Retain neat commas formatting
    onChange(newSkillsList.join(', '));
  };

  const clearAllSkills = () => {
    onChange('');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mt-3 flex flex-col gap-4 animate-in fade-in duration-200" id="skills-database-section">
      
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">
            Interactive Skill Suggestions Database
          </h3>
        </div>
        {activeSkillsList.length > 0 && (
          <button
            type="button"
            onClick={clearAllSkills}
            className="text-[10px] uppercase font-bold text-rose-500 dark:text-rose-450 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All ({activeSkillsList.length})
          </button>
        )}
      </div>

      {/* Auto-detected notice if matching title is found */}
      {userJobTitle && detectedRoles.length > 0 && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 flex items-start gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Auto-detected Profile:{" "}
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {userJobTitle}
            </span>. 
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              We highly recommend the key competencies listed in the <span className="underline decoration-indigo-400 font-semibold text-indigo-505">"Recommended"</span> tab below for this specific job field.
            </p>
          </div>
        </div>
      )}

      {/* Search and Navigation Pills */}
      <div className="space-y-3">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            placeholder="Search job titles or skills (e.g. Frontend Developer, Python, AWS, Figma)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="skills-database-search"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Horizontal Nav Bar (Hidden if search query is active) */}
        {!searchQuery && (
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              // Skip "Recommended" tab if no role was detected
              if (cat === 'Recommended' && detectedRoles.length === 0) return null;
              
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-[11px] font-bold tracking-wider rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-605 text-white bg-indigo-600 dark:bg-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 text-slate-600 hover:text-slate-805 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'Recommended' ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Recommended
                    </span>
                  ) : cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggested Skills Grid */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {searchQuery ? `Search Results (${displayedSkills.length})` : `${selectedCategory} Core Competencies`}
          </span>
          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold font-mono">
            Click to add / remove
          </span>
        </div>

        {displayedSkills.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
            No skill suggestions matched your search criteria. Try a different query.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-[190px] overflow-y-auto p-1.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:ring-1 focus-within:ring-indigo-500">
            {displayedSkills.map((skill) => {
              const isSelected = activeSkillsSet.has(skill.name.toLowerCase());
              
              return (
                <button
                  key={`${skill.name}-${skill.source}`}
                  type="button"
                  onClick={() => toggleSkill(skill.name)}
                  className={`group/btn px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all transition-transform duration-100 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-180 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                  title={`Source context: ${skill.source}`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-indigo-500" />
                  )}
                  <span>{skill.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected skill chips overview with easy deletion */}
      {activeSkillsList.length > 0 && (
        <div className="border-t border-slate-150 dark:border-slate-800/60 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
            Current Resume Competency List ({activeSkillsList.length})
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {activeSkillsList.map((skill) => (
              <div
                key={`added-${skill}`}
                className="px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-indigo-100 dark:border-indigo-900/40 hover:border-rose-200 dark:hover:border-rose-900/40 text-slate-800 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors group/added shrink-0"
                onClick={() => toggleSkill(skill)}
                title="Click to quickly delete this skill"
              >
                <span>{skill}</span>
                <span className="text-slate-400 group-hover/added:text-rose-500 transition-colors font-bold text-[10px] ml-1">×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
