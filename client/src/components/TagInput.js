import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const MAX_TAGS = 10;

const TagInput = ({ tags, setTags, placeholder }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e) => {
        // Remove last tag on backspace if input is empty
        if (e.key === 'Backspace' && input === '' && tags.length > 0) {
            setTags(tags.slice(0, -1));
            return;
        }

        // Only allow new tags if under limit
        if (['Enter', ',', ' '].includes(e.key)) {
            e.preventDefault();
            if (tags.length < MAX_TAGS) {
                addTag();
            }
        }
    };

    const handleInput = (e) => {
        // Only allow input if under tag limit
        if (tags.length >= MAX_TAGS) {
            return;
        }
        // Only allow alphanumeric characters and hyphens
        const value = e.target.value.replace(/[^a-zA-Z0-9-\s]/g, '');
        setInput(value);
    };

    const addTag = () => {
        const trimmedInput = input.trim().toLowerCase();
        if (trimmedInput && !tags.includes(trimmedInput) && tags.length < MAX_TAGS) {
            setTags([...tags, trimmedInput]);
            setInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Add tag when input loses focus
    const handleBlur = () => {
        if (input.trim()) {
            addTag();
        }
    };

    return (
        <div className="input-field mb-0 p-2 min-h-[44px] flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-full text-sm
                            bg-gray-700/50 text-gray-200 gap-1.5"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-400 transition-colors"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </span>
                ))}
            </div>
            {tags.length < MAX_TAGS ? (
                <input
                    type="text"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className="outline-none bg-transparent flex-grow min-w-[120px]"
                />
            ) : (
                <span className="text-sm text-gray-400 italic">
                    Maximum {MAX_TAGS} tags reached
                </span>
            )}
        </div>
    );
};

export default TagInput;
