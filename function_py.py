import openai
import os
import IPython
from dotenv import load_dotenv
import re

load_dotenv()


openai.api_key = os.environ['OPENAI_KEY']

# completion function
def get_completion(messages, model="gpt-3.5-turbo", temperature=0, max_tokens=300):
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message["content"]


# Function to get back a list of controllers 
def extract_controllers_from_express_route(file_path):
    controllers = []
    try:
        with open(file_path, 'r') as file:
            content = file.read()
            # Regular expression to find controller names
            controller_pattern = r'\.get\([\'"](.*?)[\'"]\s*,\s*(.*?)\)'
            matches = re.findall(controller_pattern, content)
            
            for match in matches:
                controller_name = match[1].strip()
                # Considering the controller names are in the second capture group
                controllers.append(controller_name)
    except FileNotFoundError:
        print("File not found")
    
    return controllers

# Example usage:
#file_path = '/Users/datalab04/Documents/personal/LLM/Kora-AI/gg.js'  # Replace this with the actual file path
#controllers = extract_controllers_from_express_route(file_path)
#print(controllers)


# Function that takes the Django view and cleans it up

def view_clean(file_path):
    try:
        with open(file_path, 'r') as file:
            content = file.read()
    except FileNotFoundError:
        print("File not found")

    prompt = f"""
    Your task is: given a django view, return the requested information in the section delimited by ### ###. Format the output as string.

    view:

    {content}


    ###
    rating: give the following rating to the django view; a rating of 1 if it is complete with no issues, 2 if it is incomplete and 3 if it has has issues and is incomplete.
    clean code: if rating is 1 then return the same code without changes, if rating is 2, complete the code and return the completed code. If rating is 3, then clean and complete the code and return the completed code
    ###
    """

    message = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    response = get_completion(message)
    return(print(response))
        

# Function to generate documentation

def doc_gen(file_path):
    try:
        with open(file_path, 'r') as file:
            content = file.read()
    except FileNotFoundError:
        print("File not found")

    prompt = f"""
    Your task is: given a code, return the requested information in the section delimited by ### ###. Format the output as string.

    code:

    {content}


    ###
    Language: the language the code is written in
    documentation: the itemized documentation of the code in markdown format
    ###
    """

    message = [
        {
            "role": "user",
            "content": prompt
        }
    ]


    response = get_completion(message)
    return(print(response))
        