import { EventTriggerComponent } from '../components/event-trigger/event-trigger.handler';
import { NumberGeneratorComponent } from '../components/number-generator/number-generator.handler';
import { NumberMultiplierComponent } from '../components/number-multiplier/number-multiplier.handler';
import { StateMachineComponent } from 'src/components/state-machine/state-machine.handler';
import { JobStateMachineComponent } from 'src/components/job-state-machine/job-state-machine.handler';
import { ButtonTriggerComponent } from 'src/components/button-trigger/button-trigger.handler';
import { BenchmarkAnalyzerComponent } from 'src/components/benchmark-analyzer/benchmark-analyzer.handler';
import { MessageGeneratorComponent } from 'src/components/message-generator/message-generator.handler';
import { MessageProcessorComponent } from 'src/components/message-processor/message-processor.handler';

export function initializeComponent(flow, component, backplane, server, templates) {
  let componentInstance;
  switch (component.componentRef) {
    case 'eventTrigger':
      componentInstance = new EventTriggerComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'numberGenerator':
      componentInstance = new NumberGeneratorComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'numberMultiplier':
      componentInstance = new NumberMultiplierComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'stateMachine':
      componentInstance = new StateMachineComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'jobStateMachine':
      componentInstance = new JobStateMachineComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'buttonTrigger':
      componentInstance = new ButtonTriggerComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'benchmarkAnalyzer':
      componentInstance = new BenchmarkAnalyzerComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'messageGenerator':
      componentInstance = new MessageGeneratorComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    case 'messageProcessor':
      componentInstance = new MessageProcessorComponent(flow.id, component.componentId, backplane, server, templates);
      break;
    default:
      this.logger.warn(`Unknown component type: ${component.componentRef}`);
      break;
  }
  return componentInstance;
}