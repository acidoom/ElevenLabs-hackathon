from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
import re
from pylatexenc.latex2text import LatexNodes2Text
import regex

# Load environment variables
load_dotenv()

# Initialize OpenAI LLM
llm = ChatOpenAI(
    model="gpt-4-turbo-preview",
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)

def create_math_agent():
    return Agent(
        role="Math Processing Expert",
        goal="Convert mathematical formulas into clear, natural speech",
        backstory="I am an expert in making complex math easy to understand.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def create_graph_agent():
    return Agent(
        role="Graph Interpretation Expert",
        goal="Translate visual elements into clear verbal descriptions",
        backstory="I specialize in making visual data accessible through words.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def create_nlp_agent():
    return Agent(
        role="Language Refinement Expert",
        goal="Make technical content sound natural and engaging",
        backstory="I excel at making complex content easy to listen to.",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

def create_tasks(text, math_agent, graph_agent, nlp_agent):
    math_task = Task(
        description=f"""
        Convert this mathematical text into natural speech:
        {text}
        
        Follow these rules:
        1. Replace mathematical symbols with natural language
        2. Make vector notations clear and understandable
        3. Explain operations in a conversational way
        4. Keep the mathematical meaning accurate
        """,
        agent=math_agent,
        expected_output="A natural language version of the mathematical text"
    )

    graph_task = Task(
        description="""
        Enhance any visual or graphical descriptions in the text.
        Make sure to:
        1. Clarify figure references
        2. Explain visual elements naturally
        3. Add context to help listeners understand the visuals
        """,
        agent=graph_agent,
        expected_output="Text with enhanced visual descriptions"
    )

    nlp_task = Task(
        description="""
        Make the text more natural and easy to listen to.
        Focus on:
        1. Adding natural transitions
        2. Breaking up long sentences
        3. Making the flow conversational
        4. Ensuring clarity for listeners
        """,
        agent=nlp_agent,
        expected_output="Final, polished text that sounds natural when spoken"
    )

    return [math_task, graph_task, nlp_task]

async def process_text_with_crew(text: str) -> str:
    """Process text using CrewAI with proper task kickoff."""
    try:
        print("\n=== Original Text ===")
        print(text)
        
        # Create agents
        math_agent = create_math_agent()
        graph_agent = create_graph_agent()
        nlp_agent = create_nlp_agent()
        
        # Create tasks
        tasks = create_tasks(text, math_agent, graph_agent, nlp_agent)
        
        # Create and configure the crew
        crew = Crew(
            agents=[math_agent, graph_agent, nlp_agent],
            tasks=tasks,
            verbose=True,
            process="sequential"  # Process tasks in order
        )
        
        # Kick off the crew's work
        result = crew.kickoff()
        
        print("\n=== Processing Complete ===\n")
        return result
        
    except Exception as e:
        print(f"Error in process_text_with_crew: {str(e)}")
        raise 