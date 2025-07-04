import { ServerMessage, AgentActivity } from './types/vibe-decker-api'

// Import existing interfaces from builder
interface Message {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
  agent?: "director" | "scripter" | "graphic-artist" | "data-visualizer"
}

interface AgentStatus {
  agent: "director" | "scripter" | "graphic-artist" | "data-visualizer"
  status: "idle" | "thinking" | "working" | "completed"
  task: string
  progress: number
}

export class AgentMapper {
  // Maps API phases to specific agents
  // Note: API uses Director for most interactions, other agents for specific enhancements
  private static phaseAgentMap = {
    0: { 
      active: 'director' as const, 
      message: 'Understanding your requirements...',
      task: 'Analyzing project scope'
    },
    1: { 
      active: 'director' as const,  // Director creates basic structure
      message: 'Creating presentation structure...',
      task: 'Building slide framework'
    },
    2: { 
      active: 'scripter' as const,  // Scripter enhances with meta-content
      message: 'Enhancing with narrative purpose and engagement hooks...',
      task: 'Adding narrative elements'
    },
    3: { 
      active: 'graphic-artist' as const,  // Future: visual generation
      message: 'Designing visual elements...',
      task: 'Creating visual assets'
    }
  }

  // Agent configuration
  private static agentConfig = {
    director: {
      name: "The Director",
      color: "bg-purple-100 text-purple-700",
      defaultTask: "Project oversight"
    },
    scripter: {
      name: "The Scripter",
      color: "bg-blue-100 text-blue-700",
      defaultTask: "Content creation"
    },
    "graphic-artist": {
      name: "The Graphic Artist",
      color: "bg-green-100 text-green-700",
      defaultTask: "Visual design"
    },
    "data-visualizer": {
      name: "The Data Visualizer",
      color: "bg-orange-100 text-orange-700",
      defaultTask: "Data analysis"
    }
  }

  /**
   * Maps server message to agent activity
   */
  static mapMessageToAgentActivity(message: ServerMessage): AgentActivity | null {
    const phase = message.phase || 0
    const phaseInfo = this.phaseAgentMap[phase as keyof typeof this.phaseAgentMap]
    
    if (!phaseInfo) {
      return null
    }

    if (message.type === 'status' && message.status === 'thinking') {
      return {
        agent: phaseInfo.active,
        status: 'thinking',
        message: message.message || phaseInfo.message,
        progress: 50
      }
    }

    if (message.type === 'structure_generated') {
      return {
        agent: phaseInfo.active,
        status: 'completed',
        message: `${message.phase === 2 ? 'Enhanced' : 'Created'} presentation structure`,
        progress: 100
      }
    }

    return null
  }

  /**
   * Generates agent responses from assistant messages
   */
  static generateAgentResponses(assistantMessage: string, phase: number = 0): Message[] {
    const messages: Message[] = []
    const phaseInfo = this.phaseAgentMap[phase as keyof typeof this.phaseAgentMap]
    const activeAgent = phaseInfo?.active || 'director'

    // Create agent message
    messages.push({
      id: Date.now().toString(),
      type: 'agent',
      agent: activeAgent,
      content: assistantMessage,
      timestamp: new Date()
    })

    return messages
  }

  /**
   * Calculates agent statuses based on current phase
   */
  static calculateAgentStatuses(currentPhase: number, isProcessing: boolean = false): AgentStatus[] {
    const statuses: AgentStatus[] = []

    Object.entries(this.agentConfig).forEach(([agentKey, config]) => {
      const agent = agentKey as keyof typeof this.agentConfig
      
      // Find which phase this agent is active in
      const agentPhase = Object.entries(this.phaseAgentMap).find(
        ([_, info]) => info.active === agent
      )?.[0]
      
      const agentPhaseNum = agentPhase ? parseInt(agentPhase) : -1
      
      let status: AgentStatus['status'] = 'idle'
      let task = config.defaultTask
      let progress = 0

      if (agentPhaseNum < currentPhase) {
        // Agent has completed their work
        status = 'completed'
        progress = 100
        task = `Completed ${config.defaultTask.toLowerCase()}`
      } else if (agentPhaseNum === currentPhase) {
        // Agent is currently active
        if (isProcessing) {
          status = 'thinking'
          progress = 50
          task = this.phaseAgentMap[currentPhase as keyof typeof this.phaseAgentMap]?.task || task
        } else {
          status = 'working'
          progress = 75
          task = this.phaseAgentMap[currentPhase as keyof typeof this.phaseAgentMap]?.task || task
        }
      } else {
        // Agent is waiting for their turn
        status = 'idle'
        progress = 0
        task = `Waiting for ${config.defaultTask.toLowerCase()}`
      }

      statuses.push({
        agent,
        status,
        task,
        progress
      })
    })

    return statuses
  }

  /**
   * Gets the active agent for a given phase
   */
  static getActiveAgent(phase: number): keyof typeof this.agentConfig {
    const phaseInfo = this.phaseAgentMap[phase as keyof typeof this.phaseAgentMap]
    return phaseInfo?.active || 'director'
  }

  /**
   * Gets agent configuration
   */
  static getAgentConfig(agent: keyof typeof this.agentConfig) {
    return this.agentConfig[agent]
  }

  /**
   * Gets all agent configurations
   */
  static getAllAgentConfigs() {
    return this.agentConfig
  }

  /**
   * Simulates agent workflow progression
   */
  static simulateAgentProgression(
    currentPhase: number,
    onStatusUpdate: (statuses: AgentStatus[]) => void,
    onPhaseComplete: (newPhase: number) => void
  ): void {
    const activeAgent = this.getActiveAgent(currentPhase)
    
    // Start with thinking status
    let statuses = this.calculateAgentStatuses(currentPhase, true)
    onStatusUpdate(statuses)

    // Simulate thinking time
    setTimeout(() => {
      // Move to working status
      statuses = this.calculateAgentStatuses(currentPhase, false)
      onStatusUpdate(statuses)

      // Simulate work completion
      setTimeout(() => {
        const nextPhase = currentPhase + 1
        statuses = this.calculateAgentStatuses(nextPhase, false)
        onStatusUpdate(statuses)
        onPhaseComplete(nextPhase)
      }, 2000)
    }, 1500)
  }

  /**
   * Creates initial agent statuses
   */
  static createInitialStatuses(): AgentStatus[] {
    return Object.entries(this.agentConfig).map(([agentKey, config]) => ({
      agent: agentKey as keyof typeof this.agentConfig,
      status: 'idle' as const,
      task: config.defaultTask,
      progress: 0
    }))
  }

  /**
   * Updates agent status for a specific agent
   */
  static updateAgentStatus(
    statuses: AgentStatus[],
    agent: keyof typeof this.agentConfig,
    updates: Partial<AgentStatus>
  ): AgentStatus[] {
    return statuses.map(status => {
      if (status.agent === agent) {
        return { ...status, ...updates }
      }
      return status
    })
  }

  /**
   * Checks if all agents have completed their tasks
   */
  static areAllAgentsComplete(statuses: AgentStatus[]): boolean {
    return statuses.every(status => status.status === 'completed')
  }

  /**
   * Gets the next agent in the workflow
   */
  static getNextAgent(currentAgent: keyof typeof this.agentConfig): keyof typeof this.agentConfig | null {
    const agents = Object.keys(this.agentConfig) as (keyof typeof this.agentConfig)[]
    const currentIndex = agents.indexOf(currentAgent)
    
    if (currentIndex >= 0 && currentIndex < agents.length - 1) {
      return agents[currentIndex + 1]
    }
    
    return null
  }
}