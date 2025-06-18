
import React, { useState, useEffect, useRef } from 'react';
import { Timer, Send, HelpCircle, Check, Lock } from 'lucide-react';
import { Switch } from '@headlessui/react';
import emailjs from '@emailjs/browser';

interface BaseQuestion {
  id: number;
  type: 'multiple-choice' | 'written' | 'matching' | 'written-dual' | 'written-single'; // ✅ add 'written-single' here
  text: string;
  points: number;
}
interface WrittenDualInputQuestion extends BaseQuestion {
  type: 'written-dual';
  imageSrc?: string;
}

interface WrittenSingleInputQuestion extends BaseQuestion {
  type: 'written-single';
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
}

interface WrittenQuestion extends BaseQuestion {
  type: 'written';
  answerBoxes: number;
}

interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: string[];
  rightItems: string[];
}

type QuizQuestion =
  | MultipleChoiceQuestion
  | WrittenQuestion
  | MatchingQuestion
  | WrittenDualInputQuestion
  | WrittenSingleInputQuestion; 


function generateQuestionByType(
  questionNumber: number,
  type: QuizQuestion['type'],
  quizTopic: string
): QuizQuestion {
  if (quizTopic === 'arm-processing') {
    switch (type) {
      case 'multiple-choice':
        return {
          id: questionNumber,
          type: 'multiple-choice',
          text: 'What does the LDR instruction do in ARM assembly?',
          points: 1,
          options: ['Load data register', 'Load from memory', 'Link and return', 'Logical data read']
        };
      case 'written':
        return {
          id: questionNumber,
          type: 'written',
          text: 'Explain how the ARM pipeline works and its benefits for instruction execution.',
          points: 10,
          answerBoxes: 1
        };
      case 'matching':
        return {
          id: questionNumber,
          type: 'matching',
          text: 'Match ARM assembly instructions with their descriptions.',
          points: 10,
          leftItems: ['MOV', 'LDR', 'STR', 'ADD', 'SUB'],
          rightItems: [
            'Load data from memory',
            'Store data to memory',
            'Add two values',
            'Subtract one value from another',
            'Move data between registers'
          ]
        };
    }
  }


  if (quizTopic === 'intro-perception-psychology') {
    const psychologyQuestions: QuizQuestion[] = [
      {
        id: 1,
        type: 'multiple-choice',
        text: 'Which part of the brain is primarily responsible for visual processing?',
        points: 1,
        options: ['Frontal lobe', 'Occipital lobe', 'Temporal lobe', 'Parietal lobe'],
      },
      {
        id: 2,
        type: 'multiple-choice',
        text: 'The blind spot in the human eye is due to:',
        points: 1,
        options: ['A detached retina', 'Lack of photoreceptors where the optic nerve exits', 'Too much light exposure', 'Presence of extra cones'],
      },
      {
        id: 3,
        type: 'written',
        text: 'Define perceptual constancy and provide one real-world example.',
        points: 2,
        answerBoxes: 1,
      },
      {
        id: 4,
        type: 'multiple-choice',
        text: 'Which sensory process converts stimuli into neural impulses?',
        points: 1,
        options: ['Perception', 'Interpretation', 'Transduction', 'Sensation'],
      },
      {
        id: 5,
        type: 'multiple-choice',
        text: 'What is the function of the cochlea in hearing?',
        points: 1,
        options: ['Amplifies sound waves', 'Translates sound into electrical signals', 'Filters background noise', 'Detects pitch only'],
      },
      {
        id: 6,
        type: 'written',
        text: 'Describe the difference between bottom-up and top-down processing.',
        points: 2,
        answerBoxes: 1,
      },
      {
        id: 7,
        type: 'multiple-choice',
        text: 'Which theory explains color vision using red-green, blue-yellow, and black-white channels?',
        points: 1,
        options: ['Trichromatic theory', 'Opponent-process theory', 'Signal detection theory', 'Retinex theory'],
      },
      {
        id: 8,
        type: 'multiple-choice',
        text: 'Which structure controls the amount of light entering the eye?',
        points: 1,
        options: ['Cornea', 'Lens', 'Pupil', 'Iris'],
      },
      {
        id: 9,
        type: 'written',
        text: 'Explain how context can influence perception with an example.',
        points: 2,
        answerBoxes: 1,
      },
      {
        id: 10,
        type: 'multiple-choice',
        text: 'Gestalt principles help us understand how we:',
        points: 1,
        options: ['Feel emotions', 'Interpret language', 'Organize visual scenes', 'Hear background noise'],
      },
      {
        id: 11,
        type: 'multiple-choice',
        text: 'Which term refers to the minimum stimulus needed to detect a sensation?',
        points: 1,
        options: ['Just noticeable difference', 'Absolute threshold', 'Sensory adaptation', 'Difference threshold'],
      },
      {
        id: 12,
        type: 'written',
        text: 'What is sensory adaptation and why is it beneficial?',
        points: 2,
        answerBoxes: 1,
      },
      {
        id: 13,
        type: 'multiple-choice',
        text: 'Which cue is not a monocular depth cue?',
        points: 1,
        options: ['Interposition', 'Linear perspective', 'Convergence', 'Texture gradient'],
      },
      {
        id: 14,
        type: 'multiple-choice',
        text: 'The Müller-Lyer illusion demonstrates:',
        points: 1,
        options: ['Color blindness', 'Size constancy', 'The influence of culture on perception', 'The effect of context on line perception'],
      },
      {
        id: 15,
        type: 'multiple-choice',
        text: 'Phantom limb pain is best explained by:',
        points: 1,
        options: ['Psychological trauma', 'Retinal detachment', 'Sensory memory', 'Brain-based perception'],
      },
      {
        id: 16,
        type: 'written',
        text: 'Describe how selective attention works and give an example.',
        points: 2,
        answerBoxes: 1,
      },
      {
        id: 17,
        type: 'multiple-choice',
        text: 'Which part of the ear converts sound waves into neural messages?',
        points: 1,
        options: ['Eardrum', 'Ossicles', 'Cochlea', 'Auditory canal'],
      },
      {
        id: 18,
        type: 'multiple-choice',
        text: 'Perception that occurs below conscious awareness is known as:',
        points: 1,
        options: ['Conscious perception', 'Unconscious priming', 'Subliminal perception', 'Latent detection'],
      },
      {
        id: 19,
        type: 'written',
        text: 'How does cultural background affect perception of ambiguous images?',
        points: 2,
        answerBoxes: 1,
      },
      {
        id: 20,
        type: 'multiple-choice',
        text: 'Which structure bends light to focus images on the retina?',
        points: 1,
        options: ['Pupil', 'Cornea', 'Lens', 'Iris'],
      }
    ];
    const randomIndex = Math.floor(Math.random() * psychologyQuestions.length);
    return psychologyQuestions[randomIndex]; // ✅ returns ONE question
  }

  if (quizTopic === 'managerial-accounting') {
    const fixedQuestions: QuizQuestion[] = [
      {
        id: 1,
        type: 'multiple-choice',
        text: 'Which of the following is a fixed cost?',
        points: 1,
        options: ['Raw materials', 'Factory rent', 'Direct labor', 'Sales commission'],
      },
      {
        id: 2,
        type: 'multiple-choice',
        text: 'A favourable efficiency variance for direct labour indicates that:',
        points: 1,
        options: [
          'a lower wage rate than expected was paid for direct labour.',
          'fewer direct labour hours were used during production than expected for actual output.',
          'a higher wage rate than expected was paid for direct labour.',
          'more direct labour hours were used during production than expected for actual output.'
        ]
      },
      {
        id: 3,
        type: 'multiple-choice',
        text: 'Which of the following budgets is normally prepared first?',
        points: 1,
        options: [
          'Projected Balance Sheet',
          'Statement of Expected Cash Flows',
          'Sales Plan',
          'Production Plan'
        ]
      },
    ];
  
  }

  // Default fallback if topic not matched
  return {
    id: questionNumber,
    type: 'multiple-choice',
    text: 'What is the time complexity of quicksort in the average case?',
    points: 1,
    options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)']
  };
}

function generateCP363Questions(): QuizQuestion[] {
  return [
    {
      id: 1,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following is not a benefit of normalization?',
      options: ['Eliminates redundancy', 'Improves query performance', 'Minimizes anomalies', 'Ensures data consistency']
    },
    {
      id: 2,
      type: 'multiple-choice',
      points: 1,
      text: 'In SQL, which clause is used to filter groups created by GROUP BY?',
      options: ['WHERE', 'ORDER BY', 'HAVING', 'DISTINCT']
    },
    {
      id: 3,
      type: 'multiple-choice',
      points: 1,
      text: 'Which SQL keyword is used to remove duplicate values?',
      options: ['UNIQUE', 'REMOVE', 'DISTINCT', 'FILTER']
    },
    {
      id: 4,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following violates 2NF?',
      options: ['Partial dependency', 'Transitive dependency', 'Duplicate values', 'No primary key']
    },
    {
      id: 5,
      type: 'multiple-choice',
      points: 1,
      text: 'A superkey is:',
      options: [
        'A minimal set of attributes uniquely identifying a record',
        'Any set of attributes that uniquely identifies a record',
        'A subset of the primary key',
        'A transitive dependency'
      ]
    },
    {
      id: 6,
      type: 'multiple-choice',
      points: 1,
      text: 'In relational algebra, the selection operator is denoted by:',
      options: ['ρ', 'π', 'σ', '×']
    },
    {
      id: 7,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following commands creates a new view in SQL?',
      options: ['CREATE TABLE', 'CREATE FUNCTION', 'CREATE PROCEDURE', 'CREATE VIEW']
    },
    {
      id: 8,
      type: 'multiple-choice',
      points: 1,
      text: 'What kind of JOIN returns only rows with matching values in both tables?',
      options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN']
    },
    {
      id: 9,
      type: 'multiple-choice',
      points: 1,
      text: 'What is the purpose of the information_schema in MySQL?',
      options: ['Create tables', 'Backup data', 'Store metadata about the database', 'Display user accounts']
    },
    {
      id: 10,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following is not a DML command?',
      options: ['INSERT', 'DELETE', 'SELECT', 'CREATE']
    },
    {
      id: 11,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following is a valid functional dependency?',
      options: ['A = B', 'A → B', 'A <-> B', 'A IN B']
    },
    {
      id: 12,
      type: 'multiple-choice',
      points: 1,
      text: 'The primary purpose of foreign keys is to:',
      options: ['Speed up queries', 'Allow duplicate entries', 'Enforce referential integrity', 'Increase storage']
    },
    {
      id: 13,
      type: 'multiple-choice',
      points: 1,
      text: 'What is true about BCNF?',
      options: ['Weaker than 3NF', 'Stronger than 3NF', 'Equivalent to 2NF', 'Only applies to 1NF']
    },
    {
      id: 14,
      type: 'multiple-choice',
      points: 1,
      text: 'A natural join eliminates:',
      options: ['NULLs', 'Duplicate attributes', 'Foreign keys', 'Indexes']
    },
    {
      id: 15,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of these is not a valid data type in MySQL?',
      options: ['CHAR', 'VARCHAR', 'LONGTEXT', 'WORD']
    },
    {
      id: 16,
      type: 'multiple-choice',
      points: 1,
      text: 'In MySQL, @@hostname returns:',
      options: ['Database version', 'Current user', 'Host name', 'Last error']
    },
    {
      id: 17,
      type: 'multiple-choice',
      points: 1,
      text: 'The ON DELETE CASCADE constraint means:',
      options: [
        'Do not delete anything',
        'Automatically delete child rows',
        'Log deletion',
        'Nullify child keys'
      ]
    },
    {
      id: 18,
      type: 'multiple-choice',
      points: 1,
      text: 'Which clause is used to set default values when creating a table?',
      options: ['DEFAULT', 'INIT', 'SET', 'VALUE']
    },
    {
      id: 19,
      type: 'multiple-choice',
      points: 1,
      text: 'A stored procedure differs from a function in that:',
      options: [
        'Procedures return values',
        'Procedures cannot use SELECT',
        'Procedures can’t accept parameters',
        'Functions must return a value'
      ]
    },
    {
      id: 20,
      type: 'multiple-choice',
      points: 1,
      text: 'Which indexing method supports fast insertions and deletions?',
      options: ['Hash indexing', 'B-tree', 'Binary search', 'Merge sort']
    },
    {
      id: 21,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following does not affect the physical organization of a DB?',
      options: ['Indexes', 'File type', 'Views', 'Disk block size']
    },
    {
      id: 22,
      type: 'multiple-choice',
      points: 1,
      text: 'The statement SELECT * FROM A JOIN B ON A.id = B.id is an example of:',
      options: ['Natural Join', 'Equi-Join', 'Outer Join', 'Self Join']
    },
    {
      id: 23,
      type: 'multiple-choice',
      points: 1,
      text: 'The main difference between a view and a table is that:',
      options: [
        'Tables are faster',
        'Views cannot be updated',
        'Views store data physically',
        'Tables are virtual'
      ]
    },
    {
      id: 24,
      type: 'multiple-choice',
      points: 1,
      text: 'Which of the following is required for a relation to be in 1NF?',
      options: ['No NULLs', 'No duplicate rows', 'Atomic values', 'All columns indexed']
    },
    {
      id: 25,
      type: 'multiple-choice',
      points: 1,
      text: 'What is the goal of decomposition in normalization?',
      options: [
        'Increase redundancy',
        'Introduce NULLs',
        'Avoid spurious tuples',
        'Reduce query speed'
      ]
    },
    {
      id: 26,
      type: 'multiple-choice',
      points: 1,
      text: 'Which command is used to drop a stored procedure?',
      options: ['REMOVE PROCEDURE', 'DROP SP', 'DELETE PROCEDURE', 'DROP PROCEDURE']
    },
    {
      id: 27,
      type: 'multiple-choice',
      points: 1,
      text: 'Which command retrieves the current date/time in MySQL?',
      options: ['GETDATE()', 'DATE()', 'NOW()', 'CURRENT()']
    },
    {
      id: 28,
      type: 'multiple-choice',
      points: 1,
      text: 'A candidate key is:',
      options: [
        'A superkey that’s not a primary key',
        'A foreign key',
        'A superkey with no unnecessary attributes',
        'A key with NULLs'
      ]
    },
    {
      id: 29,
      type: 'multiple-choice',
      points: 1,
      text: 'Which relational algebra operation removes columns?',
      options: ['Projection', 'Selection', 'Join', 'Union']
    },
    {
      id: 30,
      type: 'multiple-choice',
      points: 1,
      text: 'Which command is used to ensure an event runs at regular intervals?',
      options: ['CREATE TIMER', 'CREATE SCHEDULE', 'CREATE EVENT', 'SET LOOP']
    },
    {
      id: 31,
      type: 'written',
      points: 10,
      text: `You are given the following relation:\n\nStudent(student_id, name, major, advisor_id, advisor_name, advisor_office)\n\nAnd the following functional dependencies:\n\nstudent_id → name, major, advisor_id\nadvisor_id → advisor_name, advisor_office\n\n(a) Identify the candidate key(s).\n(b) Explain why this relation is not in 3NF.\n(c) Decompose the relation into relations that are in 3NF. Show all steps clearly.`,
      answerBoxes: 1
    },
    {
      id: 32,
      type: 'written',
      points: 10,
      text: `Using the schema below:\n<img src="/questions/sqlchart.PNG" alt="Schema Tables" style="width: 90%;  margin: 12px 0;" />\nWrite a SQL query to:\n(a) List all products where the total quantity ordered across all orders is greater than the average quantity ordered for all products.\n\n(b) List manufacturers from the "products" table that do not have any products currently listed in any "order_details" records.`,
      answerBoxes: 1
    },
    {
      id: 33,
      type: 'written',
      points: 10,
      text: `(a) Define what a view is in SQL and explain how it differs from a stored procedure. Include at least two key differences in your explanation.\n\n(b) Discuss the advantages and limitations of using views compared to physical tables. In your answer, include one practical situation where using a view is preferable to creating a new table.`,
      answerBoxes: 1
    }


  ];
}


function generateFixedManagerialAccountingQuestions(): QuizQuestion[] {
  return [
    {
      id: 1,
      type: 'multiple-choice',
      text: `"The sales plan is the cornerstone for budgeting." Why?`,
      points: 1,
      options: [
        'The sales forecast is based on demand, and without demand for the product there would be no sales.',
        'none of the options listed',
        'The cost of goods sold plan, as the starting point for the operating plan, uses the planned unit sales.',
        'The production and inventory levels generally depend on the forecasted level of demand and revenue.'
      ]
    },
    {
      id: 2,
      type: 'multiple-choice',
      text: `Wild West Fashion expects the total costs of goods sold to be $30,000 in November and $60,000 in December for one of its young adult suits. Management also wants to have on hand at the end of each month 10 percent of the expected total cost of sales for the following month. What dollar amount of suits should be purchased in November?`,
      points: 1,
      options: [
        '$33,000',
        '$26,000',
        '$36,000',
        '$60,000',
        '$27,000'
      ]
    },
    {
      id: 3,
      type: 'multiple-choice',
      text: `Which of the following budgets is normally prepared first?`,
      points: 1,
      options: [
        'Projected Balance Sheet',
        'Statement of Expected Cash Flows',
        'Sales Plan',
        'Production Plan'
      ]
    },
    {
      id: 4,
      type: 'multiple-choice',
      text: `The following projections have been made:\n
  1. Cash sales, $380,000.\n
  2. Beginning cash balance, $30,000.\n
  3. Operating expenses of $420,000, including depreciation of $20,000\n
  4. Interest expense of $12,000 is included in operating expenses and was paid in cash\n
  5. Borrowing, $50,000.\n
  6. End-of-period accrued liabilities increased by $20,000 for operating expenses.\n
  What is the projected ending cash balance?`,
      points: 1,
      options: [
        '$40,000',
        '$52,000',
        '$48,000',
        '$80,000'
      ]
    },
    {
      id: 5,
      type: 'multiple-choice',
      text: `In order to maximize profitability when production capacity is limited, management should maximize the sales of the product that has the:`,
      points: 1,
      options: [
        'highest gross margin.',
        'highest contribution margin per unit of scarce resource.',
        'lowest opportunity cost per unit of production.',
        'highest contribution margin per unit of production.'
      ]
    },
    {
      id: 6,
      type: 'multiple-choice',
      text: `In a process system, direct labour and manufacturing overhead are normally:`,
      points: 1,
      options: [
        'incurred evenly throughout the process.',
        'equal to direct materials costs.',
        'incurred at the start of the production process.',
        'not recorded.'
      ]
    },
    {
      id: 7,
      type: 'multiple-choice',
      text: `A favourable efficiency variance for direct labour indicates that:`,
      points: 1,
      options: [
        'fewer direct labour hours were used during production than expected for actual output.',
        'a lower wage rate than expected was paid for direct labour.',
        'a higher wage rate than expected was paid for direct labour.',
        'more direct labour hours were used during production than expected for actual output.'
      ]
    },
    {
      id: 8,
      type: 'multiple-choice',
      text: `Of the following costs, which would most likely be a fixed cost with respect to the volume of units produced and sold?`,
      points: 1,
      options: [
        'Electricity for equipment used in production',
        'Salaries of factory supervisors who oversee production',
        'Packaging materials for finished goods',
        'Ingredients in cake mix boxes'
      ]
    },
    {
      id: 9,
      type: 'written-dual',
      text: `Consider the following information regarding direct labour for a product:<br/><img src="/questions/question9photo.PNG" alt="Question 9" style="width: 35%;" /><br/><br/>Actual units sold during the period were 41,000 units.<br/><br/>With the given information, calculate the direct labour efficiency variance.<br/>Enter the number in the first box provided with no dollar signs, commas, or spaces. Round your answer to the nearest whole dollar. In the box labelled units, enter either F if the variance is favourable or U if the variance is unfavourable. For example, if you got the variance $20,104.3 F you would enter 20104 in the first box and F in the second box. If you calculated -$20,104.3 U, then you would enter -20104 in the first box and U in the second box.<br/><br/>Your Answer:`,
      points: 2,
      imageSrc: '/questions/question9photo.PNG'
    },
    {
      id: 10,
      type: 'multiple-choice',
      text: 'Which of the following is NOT a component of the flexible budget variance?',
      points: 1,
      options: [
        'Sales price variance',
        'direct material quantity variance',
        'Sales mix variance',
        'direct labour efficiency variance'
      ]
    },
    {
      id: 11,
      type: 'multiple-choice',
      text: 'A favourable efficiency variance for direct labour indicates that',
      points: 1,
      options: [
        'more direct labour hours were used during production than expected for actual output',
        'a higher wage rate than expected was paid for direct labour',
        'fewer direct labour hours were used during production than expected for actual output',
        'a lower wage rate than expected was paid for direct labour'
      ]
    },
    {
      id: 12,
      type: 'multiple-choice',
      text: 'Financial budgets are prepared:',
      points: 1,
      options: [
        'to plan for production capacity.',
        'to specify expectations for selling, purchasing, and production.',
        'to evaluate the financial results of the proposed decisions.',
        'so that financial statements can be prepared for shareholders.'
      ]
    },
    {
      id: 13,
      type: 'multiple-choice',
      text: 'Which of the following is not a role of budgeting?',
      points: 1,
      options: [
        'Supporting planning',
        'To provide direction for organization',
        'To project or forecast costs',
        'All of the options are roles of budgeting',
        'To meet the requirements of professional accounting bodies such as IFRS since these budgets will be presented to external users'
      ]
    },
    {
      id: 14,
      type: 'multiple-choice',
      text: 'A sales quantity variance will change when:',
      points: 1,
      options: [
        'An organization sells more units than it planned',
        'The planned sales mix changes',
        'The contribution margin of any product changes',
        'all potions listed'
      ]
    },
    {
      id: 15,
      type: 'multiple-choice',
      text: 'Which of the following is a component of the pricing waterfall?',
      points: 1,
      options: [
        'All of the choices',
        'Invoice price',
        'Dealer list price'
      ]
    },
    {
      id: 16,
      type: 'multiple-choice',
      text: 'A sales quantity variance will change when:',
      points: 1,
      options: [
        'An organization sells more units in total than it planned.',
        'The contribution margin of any product changes.',
        'The actual sales mix is different from the planned sales mix.',
        'All the other choices.'
      ]
    },
    {
      id: 17,
      type: 'multiple-choice',
      text: 'Wilson manufactures and sells a single product, leather footballs, for an average selling price of $41 per football. The company has variable manufacturing costs of $14 per football and variable selling costs of $3 per football. Fixed costs for the period are $300,000. How many footballs must Wilson sell in order to achieve an operating income of $100,000?',
      points: 1,
      options: [
        '11,111',
        '14,815',
        '12,000',
        '16,667'
      ]
    },
    {
      id: 18,
      type: 'multiple-choice',
      text: 'Which of the following is false about flexible budgets?',
      points: 1,
      options: [
        'They reflect the same level of production as the master (static) budget.',
        'They allow comparison of actual results to targets based on the achieved level of production.',
        'They result in higher total costs for greater levels of production.',
        'They use the same variable costs per unit of input as the master budget.'
      ]
    },
    {
      id: 19,
      type: 'multiple-choice',
      text: 'A budget that is adjusted in accordance with changes in actual output is called',
      points: 1,
      options: [
        'a cost budget',
        'a balanced budget',
        'a static budget',
        'a flexible budget',
        'an actual budget'
      ]
    },
    {
      id: 20,
      type: 'multiple-choice',
      text: 'Which of the following is not a role of budgeting?',
      points: 1,
      options: [
        'To provide direction for organization',
        'Supporting planning',
        'To project or forecast costs',
        'To meet the requirements of professional accounting bodies such as IFRS since these budgets will be presented to external users',
        'All of the options are roles of budgeting'
      ]
    },
    {
      id: 21,
      type: 'written-dual',
      text: `The total planning variance for firm-wide operating income was $59,000F. The sales quantity variance was $42,000U.\n\nWhat is the sales mix variance?\n\nEnter the number in the first box provided with no dollar signs, commas, or spaces. Round your answer to the nearest whole dollar. In the box labelled units, enter either F if the variance is favourable or U if the variance is unfavourable. For example, if you got the variance $20,000 F you would enter 20000 in the first box and F in the second box. If you calculated -$20,000U, then you would enter -20000 in the first box and U in the second box.`,
      points: 2
    },
    {
      id: 22,
      type: 'written-dual',
      text: `Consider the following information regarding direct materials for a product:\n\n<img src="/questions/question22.PNG" alt="Direct materials info" style="max-width: 35%;" />\n\nActual units sold during the period were 15,000 units.\n\nWith the given information, calculate the direct materials quantity variance.\n\nEnter the number in the first box provided with no dollar signs, commas, or spaces. Round your answer to the nearest whole dollar. In the box labelled units, enter either F if the variance is favourable or U if the variance is unfavourable. For example, if you got the variance $20,104.3 U you would enter 20104 in the first box and U in the second box. If you calculated -$20,104.3 F, then you would enter -20104 in the first box and F in the second box.`,
      points: 2
    },

    {
      id: 23,
      type: 'multiple-choice',
      text: `A favourable efficiency variance for direct labour indicates that:`,
      points: 1,
      options: [
        'a lower wage rate than expected was paid for direct labour.',
        'fewer direct labour hours were used during production than expected for actual output.',
        'a higher wage rate than expected was paid for direct labour.',
        'more direct labour hours were used during production than expected for actual output.'
      ]
    },
    
    // Question 24
    {
      id: 24,
      type: 'multiple-choice',
      text: `Which of the following statements about budgets is false?`,
      points: 1,
      options: [
        'Updating forecasts throughout the year is part of budgeting.',
        'Budgeted performance can be compared with actual performance.',
        'Budgets set targets for future performance.',
        'Budgets are always prepared before strategy is set.',
        'Budgets communicate short-term goals to employees.'
      ]
    },
    
    // Question 25 – single written box
    {
      id: 25,
      type: 'written-single',
      text: `Frederick Consulting had just landed a white whale of a customer, Wilfrid Laurier University, after spending $47,000 in initial acquisition costs! Laurier is expected to generate $32,000 a year in margin, and Frederick Consulting expects this relationship to last for a very long time (decades). Additional costs to serve and retain Laurier are estimated to be $10,000 annually. The retention rate per period is 90%. The cost of capital for Frederick Consulting is 11%.\n\nWhat is the customer lifetime value of Wilfrid Laurier University for Frederick Consulting?\n\n**Round your answer to the nearest dollar.** Enter your answer with no commas, dollar signs, or spaces. If the answer is negative, make sure to include the negative sign.`,
      points: 2
    },
    
    // Question 26
    {
      id: 26,
      type: 'multiple-choice',
      text: `A packaging company produces cardboard boxes in an automated process... What is the flexible-budget amount for operating income for 40,000 and 20,000 units, respectively?`,
      points: 2,
      options: [
        '$26,000; $20,000',
        '$2,500; -$14,500',
        '$44,000; $38,000',
        '$40,000; $34,000',
        '$36,000; $30,000'
      ]
    },
    
    // Question 27 – single written box
    {
      id: 27,
      type: 'written-single',
      text: `Blackwood Industries (Business Number BN#9010085730) has the following projected unit sales for the fourth quarter:\n\n**October**: 37,000 units\n**November**: 26,000 units\n**December**: 28,000 units\n\nThe budgeted sales price is $18 per unit. Historically, around 24% of sales are in cash, the rest are on account (i.e., collected after the time of sale). 36% of sales on account are collected in the month of sale. 36% of sales on account are collected in the month after the sale. The remaining amount of sales on account are collected two months after the sale.\n\nWhat would be the **budgeted amount of accounts receivable** at the end of December?\n\n**Enter the amount rounded to the nearest dollar** with no commas, spaces, or dollar signs.`,
      points: 1.5
    },
    
    // Question 28
    {
      id: 28,
      type: 'multiple-choice',
      text: `Stark Industries only produces two products... If there are 10,000 hours of machine time available, the production plan generating the highest profit will be:`,
      points: 1.5,
      options: [
        '900 units of Product A and zero units of Product B',
        '3,400 units of Product A and 6,600 units of Product B',
        'none of the options listed',
        '1,100 units of Product B and 900 units of Product A',
        '340 units of Product A and 1,100 units of Product B'
      ]
    },
    
    // Question 29 – dual input
    {
      id: 29,
      type: 'written-dual',
      points: 2,
      text: `Cambridge House Furniture (Business number BN#428560376) has a static budget that includes the two products it sells:<br /><br />
    <img src="/questions/question29.PNG" alt="Static Budget Info for Chairs and Tables" style="max-width: 400px; height: auto;" /><br /><br />
    The company actually sold 12,000 Chairs and 15,000 Tables.<br /><br />
    What is the planning variance for contribution margin at a total company level for Cambridge House Furniture?<br /><br />
    Make sure to enter the number as it is calculated (as a positive or negative value). Also, in the box labelled units, indicate if it's favourable or unfavourable. Use F or U in the box labelled units to indicate this. For example, if you got the variance $20,000 F, you would enter 20000 in the first box and F in the second box. If you calculated -$20,000 U, then you would enter -20000 in the first box and U in the second box.`,
    },
    {
      id: 30,
      type: 'multiple-choice',
      points: 1,
      text: `Wilson manufactures and sells a single product, leather footballs, for an average selling price of $41 per football. The company has variable manufacturing costs of $14 per football and variable selling costs of $3 per football. Fixed costs for the period are $300,000. How many footballs must Wilson sell in order to achieve an operating income of $100,000?`,
      options: [
        '11,111',
        '14,815',
        '12,000',
        '16,667',
      ]
    },
    {
      id: 31,
      type: 'multiple-choice',
      points: 1.5,
      text: `Robust Ltd. is deciding between making and buying a component of its cars. The relevant cost to make a component of a car is $30 per unit + $40,000 in avoidable fixed costs per period. The relevant cost to buy this component from an external supplier is $50 per unit. If the firm buys from the supplier, they can lease out their facilities for $30,000 per period.<br /><br />At what quantity of units would the firm be indifferent between making and buying the component?`,
      options: [
        '3,750 units',
        '4,000 units',
        '3,500 units',
        '5,000 units',
      ]
    },
    {
      id: 32,
      type: 'multiple-choice',
      points: 1,
      text: `Anchester Company manufactures remote control devices for garage doors. The following information was collected during June:<br /><br />
    Actual market size (units): 10,000<br />
    Actual market share: 32%<br />
    Actual average selling price: $10.00<br />
    Planned market size (units): 11,000<br />
    Planned market share: 30%<br />
    Planned average selling price: $11.00<br />
    Planned weighted avg. CMU: $5.00<br /><br />
    What was the firm’s market share variance?`,
      options: [
        '$1,100 F',
        '$1,000 F',
        '$1,000 U',
        '$1,100 U',
        '$500 U',
      ]
    },
    {
      id: 33,
      type: 'multiple-choice',
      points: 1,
      text: `Tony’s Trinkets produces 2 products: the Dog which has a contribution margin of $5 per unit, and the Cat which has a contribution margin of $8 per unit. The planned sales are 60,000 units of Dog and 40,000 units of Cat. The estimated total market for these two products was 1,000,000. Tony’s Trinkets sold 50,000 units of Dog and 60,000 units of Cat. Total market sales of the two products were 900,000 units.<br /><br />What was the market share variance for Tony’s Trinkets?`,
      options: [
        '$68,000 favourable',
        '$133,000 favourable',
        '$124,000 favourable',
        '$112,000 favourable',
      ]
    },
    {
      id: 34,
      type: 'multiple-choice',
      points: 1,
      text: `Diamond Company has three product lines, A, B, and C. The following financial information is available:<br /><br />
      <img src="/questions/question34.PNG" alt="Diamond Company product lines" style="max-width: 50%; height: auto; margin: 1rem 0;" /><br />
      If Product Line C is discontinued and the manufacturing space formerly devoted to this line is rented for $6,000 per year, pre-tax operating income for the company will likely:`,
      options: [
        'Increase by $3,300.',
        'Increase by $7,200.',
        'Increase by some other amount.',
        'Increase by $4,500.',
        'Be unchanged—the two effects cancel each other out.'
      ]
    },
    {
      id: 35,
      type: 'written-dual',
      points: 2,
      text: `Cambridge House Furniture (Business number BN#866057643) has the following static budget for the two products it sells:\n\n<img src="/questions/question35.PNG" alt="Static Budget Chairs Tables" style="max-width: 50%;" />\n\nThe company actually sold 12,000 Chairs and 14,000 Tables.\n\nWhat is the planning variance for contribution margin at a total company level for Cambridge House Furniture?\n\nMake sure to enter the number as it is calculated (as a positive or negative) AND put a capitalized **F** or **U** in the box labelled units to indicate if it is favourable or unfavourable.\n\nDo not include commas, decimal points, or spaces.\n\nFor example:\n- If the answer is $20,000 F → enter 20000 and F\n- If the answer is -$20,000 U → enter -20000 and U`,
      imageSrc: '/questions/question35.PNG'
    },
    {
      id: 36,
      type: 'multiple-choice',
      points: 1,
      text: `Wild West Fashion expects the total costs of goods sold to be $30,000 in November and $60,000 in December for one of its young adult suits. Management also wants to have on hand at the end of each month 10 percent of the expected total cost of sales for the following month.\n\nWhat dollar amount of suits should be purchased in November?`,
      options: [
        '$33,000.',
        '$26,000.',
        '$36,000.',
        '$60,000.',
        '$27,000.'
      ]
    },
    {
      id: 37,
      type: 'multiple-choice',
      points: 1,
      text: `ACEM Hardware purchased 5,000 gallons of paint in March. The store had 1,500 gallons on hand at the beginning of March, and expects to have 1,000 gallons on hand at the end of March.\n\nWhat is the budgeted number of gallons to be sold during March?`,
      options: [
        '5,000.',
        '5,500.',
        '4,500.',
        '7,500.',
        '3,500.'
      ]
    },
    {
      id: 38,
      type: 'multiple-choice',
      points: 1,
      text: `The Johann's Professional Service Company expects 70% of sales for cash and 30% on credit. The company collects 80% of its credit sales in the month following sale, 15% in the second month following sale, and 5% are not collected (bad debts).\n\nExpected sales for June, July, and August are $48,000, $54,000, and $44,000, respectively.\n\nWhat are the company's expected total cash receipts in August?`,
      options: [
        '$50,400',
        '$87,600.',
        '$15,120.',
        '$45,920',
        '$61,400'
      ]
    },
    {
      id: 39,
      type: 'multiple-choice',
      points: 1,
      text: `Copper Corporation has the following sales budget for the last six months of 2019:\n\n<img src="/questions/question39.PNG" alt="Copper Corporation Sales Budget" style="max-width: 50%;" />\n\nHistorically, the cash collection of sales has been as follows:\n- 65% of sales collected in month of sale\n- 25% of sales collected in month following sale\n- 8% of sales collected in second month following sale\n- 2% of sales is uncollectable\n\nWhat are the cash collections for **September**?`,
      options: [
        '$161,400.',
        '$240,000',
        '$204,000',
        '$143,000',
        '$199,000'
      ]
    },    
    {
      id: 40,
      type: 'written-single',
      text: `Frederick Consulting had just landed a white whale of a customer, Wilfrid Laurier University, after spending $41,000 in initial acquisition costs! Laurier is expected to generate $30,000 a year in margin, and Frederick Consulting expects this relationship to last for a very long time (decades). Additional costs to serve and retain Laurier are estimated to be $16,000 annually. The retention rate per period is 93%. The cost of capital for Frederick Consulting is 13%.\n\nWhat is the customer lifetime value of Wilfrid Laurier University for Frederick Consulting?\n\nRound your answer to the nearest dollar. Enter your answer with no commas, dollar signs, or spaces. If the answer is negative, make sure to include the negative sign.`,
      points: 1.5
    },
    {
      id: 41,
      type: 'multiple-choice',
      text: `All Good Things Ltd. planned on producing 600 units for the year. However, actual production was 400 units.\n\nInformation concerning the direct labour cost for All Good Things Ltd. is as follows:\n- Actual results: 1,000 hours at $25/hour\n- Static budget: 1,200 hours at $21/hour\n\nWhat is the direct labour efficiency variance?`,
      points: 1,
      options: [
        '$4,200U',
        '$5,000F',
        '$4,200F',
        '$200U',
        '$5,000U'
      ]
    },
    {
      id: 42,
      type: 'multiple-choice',
      text: `Tony’s Trinkets produces 2 products: the Dog (CM = $5/unit) and the Cat (CM = $8/unit).\n\nPlanned sales:\n- Dog: 60,000 units\n- Cat: 40,000 units\nTotal market estimate: 1,000,000 units\n\nActual sales:\n- Dog: 50,000 units\n- Cat: 60,000 units\nTotal market sales: 900,000 units\n\nWhat was the market share variance?`,
      points: 1,
      options: [
        '$68,000 favourable',
        '$133,000 favourable',
        '$124,000 favourable',
        '$112,000 favourable'
      ]
    },
    {
      id: 43,
      type: 'multiple-choice',
      text: `All Good Things Ltd. planned on producing 600 units for the year. However, actual production was 400 units.\n\nActual results: 1,000 hours at $25/hour\nStatic budget: 1,200 hours at $21/hour\n\nWhat is the flexible-budget variance?`,
      points: 1,
      options: [
        '$200 U',
        '$8,400 U',
        '$8,200 F',
        '$8,200 U',
        '$8,400 F'
      ]
    },
    {
      id: 44,
      type: 'written-dual',
      text: `The total planning variance for firm-wide operating income was $59,000F. The sales quantity variance was $42,000U.\n\nWhat is the sales mix variance?\n\nEnter the number in the first box provided with no dollar signs, commas, or spaces. Round your answer to the nearest whole dollar. In the box labelled units, enter either F if the variance is favourable or U if the variance is unfavourable.\n\nExample: $20,000 F → 20000 and F`,
      points: 2
    },
    {
      id: 45,
      type: 'multiple-choice',
      text: `Boone Hobbies, a wholesaler, has a sales plan for next month of $600,000. Cost of units sold is expected to be 40% of sales. All units are paid for in the month following purchase. The beginning inventory of units is $20,000, and an ending amount of $24,000 is desired. Beginning accounts payable is $152,000.\n\nWhat should Boone Hobbies plan for cash used to pay accounts payable for the month?`,
      points: 1,
      options: [
        '$152,000',
        '$148,600',
        '$244,000',
        '$156,000',
        '$240,000'
      ]
    }



    
    // 🔁 Keep adding until you reach all 45 questions
  ];
}


function generateQuestions(
  totalQuestions: number,
  types: { multipleChoice: boolean; written: boolean; matching: boolean },
  quizTopic: string
): QuizQuestion[] {
  const enabledTypes = [
    types.multipleChoice && 'multiple-choice',
    types.written && 'written',
    types.matching && 'matching'
  ].filter(Boolean) as QuizQuestion['type'][];

  if (enabledTypes.length === 0) {
    enabledTypes.push('multiple-choice');
  }

  if (quizTopic === 'managerial-accounting') {
    return generateFixedManagerialAccountingQuestions();
  }

  if (quizTopic === 'cp363') {
    return generateCP363Questions();
  }
  
  const questions: QuizQuestion[] = [];

  // 👉 STEP 1: Inject custom ARM questions
  if (quizTopic === 'arm-processing') {
    questions.push(
      {
        id: 1,
        type: 'multiple-choice',
        text: `What does this ARM assembly code do?\n\n<img src="/questions/problem1.png" alt="ARM Problem 1" />`,
        points: 1,
        options: [
          'Increments r2 and compares to r1',
          'Loads data from memory to r2',
          'Adds r2 and r1 without a loop',
          'Performs a software interrupt'
        ]
      },
      {
        id: 2,
        type: 'written',
        text: `Analyze this ARM loop and explain how it traverses data.\n\n<img src="/questions/problem2.png" alt="ARM Problem 2" />`,
        points: 10,
        answerBoxes: 1
      },
      {
        id: 3,
        type: 'matching',
        text: `Match the code line to its description.\n\n<img src="/questions/problem3.png" alt="ARM Problem 3" />`,
        points: 10,
        leftItems: ['ldr r2, =Data', 'cmp r0, #0', 'bge TestPositive', 'add r7, r7, #1', 'b _stop'],
        rightItems: [
          'Load address into r2',
          'Branch if greater than or equal',
          'Increment register r7',
          'Compare r0 to 0',
          'End the program'
        ]
      }
    );
  }

  // 👉 STEP 2: Fill in the rest using regular generation
  const remaining = totalQuestions - questions.length;
  const questionsPerType = Math.floor(remaining / enabledTypes.length);
  const leftovers = remaining % enabledTypes.length;

  enabledTypes.forEach((type, index) => {
    const count = index < leftovers ? questionsPerType + 1 : questionsPerType;
    for (let i = 0; i < count; i++) {
      questions.push(generateQuestionByType(questions.length + 1, type, quizTopic));
    }
  });

  // Optional shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
    questions[i].id = i + 1;
    questions[j].id = j + 1;
  }

  return questions;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'setup' | 'instructions' | 'quiz'>('setup');
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizTitle, setQuizTitle] = useState('Final Exam- Requires Respondus LockDown Browser');
  const [userName, setUserName] = useState('Daniel Gonzalez');
  const [timeLimit, setTimeLimit] = useState('120');
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState('1');
  const [quizTopic, setQuizTopic] = useState('cp363');

  const [questionsPerPage, setQuestionsPerPage] = useState('33');
  const [numberOfPages, setNumberOfPages] = useState('1');
  const [currentQuizPage, setCurrentQuizPage] = useState(1);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string[]>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, number[]>>({});
  const [chatMessage, setChatMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [requirePassword, setRequirePassword] = useState(false);
  const [quizPassword, setQuizPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quizContentRef = useRef<HTMLDivElement>(null); // 👈 Add here


  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  const [includeWrittenAnswers, setIncludeWrittenAnswers] = useState(true);
  const [includeMatching, setIncludeMatching] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  

  useEffect(() => {
    const container = quizContentRef.current;
    if (!container) return;
  
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
  
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage]);
  

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentPage === 'quiz' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [currentPage, timeLeft]);

  // Add new useEffect for chat cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [cooldownTime]);

  useEffect(() => {
    if (currentPage === 'quiz') {
      document.body.classList.add('quiz-active');
      document.body.classList.add('hide-scrollbar'); // Add this line
    } else {
      document.body.classList.remove('quiz-active');
      document.body.classList.remove('hide-scrollbar'); // Add this line
    }
  }, [currentPage]);

  const quizTopics = [
    { id: 'computer-science', name: 'Computer Science' },
    { id: 'arm-processing', name: 'ARM Processing' },
    { id: 'intro-perception-psychology', name: 'Intro to Perception Psychology' },
    { id: 'managerial-accounting', name: 'Managerial Accounting' },
    { id: 'cp363', name: 'CP363: Database Systems' }, // 👈 Add this
  ];

  //const totalQuestions = parseInt(questionsPerPage) * parseInt(numberOfPages);

  useEffect(() => {
    if (isQuizStarted) {
      const totalQuestions = parseInt(questionsPerPage) * parseInt(numberOfPages);
      const newQuestions = generateQuestions(
        quizTopic === 'managerial-accounting' ? 45 : totalQuestions,
        {
          multipleChoice: includeMultipleChoice,
          written: includeWrittenAnswers,
          matching: includeMatching
        },
        quizTopic
      );
      setQuestions(newQuestions);
      questionRefs.current = questionRefs.current.slice(0, quizTopic === 'managerial-accounting' ? 45 : totalQuestions);
    }
  }, [
    isQuizStarted,
    quizTopic,
    questionsPerPage,
    numberOfPages,
    includeMultipleChoice,
    includeWrittenAnswers,
    includeMatching
  ]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuizStarted(true);
    setCurrentPage('instructions');
  };

  const handleBeginQuiz = async () => {
    if (requirePassword && quizPassword) {
      try {
        await emailjs.send(
          'Lockdownrecreation',
          'template_y2t9ruc',
          {
            message: quizPassword,
          },
          'BR3ar8OdLV04yWZBF'
        );
        setIsPasswordValid(true);
      } catch (error) {
        console.error('Error sending password:', error);
        return;
      }
    }
    
    setCurrentPage('quiz');
    setTimeLeft(parseInt(timeLimit) * 60);
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleWrittenAnswer = (questionId: number, answerIndex: number, value: string) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setWrittenAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [answerIndex]: value
      }
    }));
  };

  const handleMatchingAnswer = (questionId: number, leftIndex: number, rightIndex: number) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setMatchingAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [leftIndex]: rightIndex
      }
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      try {
        await emailjs.send(
          'Lockdownrecreation',
          'template_y2t9ruc',
          {
            message: chatMessage,
          },
          'BR3ar8OdLV04yWZBF'
        );
        setChatMessage('');
        setCooldownTime(30);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const scrollToQuestion = (questionNumber: number) => {
    questionRefs.current[questionNumber - 1]?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-[0rem]">
            {question.options.map((option, optIndex) => {
              const isSelected = selectedAnswers[question.id] === optIndex;
              return (
                <label 
                  key={optIndex} 
                  className={`answer-option flex items-center space-x-2 ${
                    isSelected ? 'selected' : ''
                  }`}
                >
                  <input 
                    type="radio" 
                    name={`answer-${question.id}`}
                    checked={isSelected}
                    onChange={() => handleAnswerSelect(question.id, optIndex)}
                    className="form-radio"
                  />
                  <span className="text-[1.18rem]">{option}</span>

                </label>
              );
            })}
          </div>
        );

      case 'written':
        return (
          <div className="space-y-4">
            {Array.from({ length: question.answerBoxes }).map((_, index) => (
              <div key={index} className="flex items-start space-x-2">
                <textarea
                  className="w-full h-32 p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"

                  placeholder="Enter your answer here..."
                  value={writtenAnswers[question.id]?.[index] || ''}
                  onChange={(e) => handleWrittenAnswer(question.id, index, e.target.value)}
                />
                <div className="flex items-center justify-center w-8 h-8">
                  <Check className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'matching':
        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {question.leftItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={matchingAnswers[question.id]?.[index] || ''}
                    onChange={(e) => handleMatchingAnswer(question.id, index, parseInt(e.target.value))}
                  >
                    <option value="">Select a match...</option>
                    {question.rightItems.map((_, optIndex) => (
                      <option key={optIndex} value={optIndex}>
                        {optIndex + 1}
                      </option>
                    ))}
                  </select>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {question.rightItems.map((item, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-md">
                  <span>{index + 1}. {item}</span>
                </div>
              ))}
            </div>
          </div>
        );

        case 'written-dual':
          return (
            <div className="flex flex-col gap-4 w-full max-w-[300px]">
              <div className="flex flex-row gap-2 items-start">
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    className="w-[160px] px-2 py-1 rounded-md border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={writtenAnswers[question.id]?.[0] || ''}
                    onChange={(e) => handleWrittenAnswer(question.id, 0, e.target.value)}
                  />
                  <span className="text-m text-gray-800 mt-2">Answer</span>
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    className="w-[60px] px-2 py-1 rounded-md border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={writtenAnswers[question.id]?.[1] || ''}
                    onChange={(e) => handleWrittenAnswer(question.id, 1, e.target.value)}
                  />
                  <span className="text-m text-gray-800 mt-2">Units</span>
                </div>
              </div>
            </div>
          );

          case 'written-single':
            return (
              <div className="flex flex-col items-start space-y-1 mt-2">
                <input
                  type="text"
                  value={writtenAnswers[question.id]?.[0] || ''}
                  onChange={(e) =>
                    setWrittenAnswers(prev => ({
                      ...prev,
                      [question.id]: {
                        ...prev[question.id],
                        0: e.target.value
                      }
                    }))
                  }
                  className="w-[160px] h-[32px] px-3 py-1 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="px-12 text-m text-gray-600 ml-[4px]">Answer</span>
              </div>
            );
    }
    
  };

  if (currentPage === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        
        <form onSubmit={handleStartQuiz} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Quiz Setup</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Title
              </label>
              <input
                type="text"
                id="quizTitle"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="quizTopic" className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Topic
              </label>
              <select
                id="quizTopic"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {quizTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="questionsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                Questions Per Page
              </label>
              <input
                type="number"
                id="questionsPerPage"
                value={questionsPerPage}
                onChange={(e) => setQuestionsPerPage(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label htmlFor="numberOfPages" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Pages
              </label>
              <input
                type="number"
                id="numberOfPages"
                value={numberOfPages}
                onChange={(e) => setNumberOfPages(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter time limit in minutes"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Require Password</span>
                <span className="text-sm text-gray-500">Students must enter a password to access the quiz</span>
              </div>
              <Switch
                checked={requirePassword}
                onChange={setRequirePassword}
                className={`${
                  requirePassword ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span className="sr-only">Require password</span>
                <span
                  className={`${
                    requirePassword ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium text-gray-700">Question Types</h3>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Multiple Choice</span>
                  <span className="text-sm text-gray-500">Questions with predefined options</span>
                </div>
                <Switch
                  checked={includeMultipleChoice}
                  onChange={setIncludeMultipleChoice}
                  className={`${
                    includeMultipleChoice ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      includeMultipleChoice ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Written Answers</span>
                  <span className="text-sm text-gray-500">Free-form text responses</span>
                </div>
                <Switch
                  checked={includeWrittenAnswers}
                  onChange={setIncludeWrittenAnswers}
                  className={`${
                    includeWrittenAnswers ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      includeWrittenAnswers ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Matching</span>
                  <span className="text-sm text-gray-500">Match items from two columns</span>
                </div>
                <Switch
                  checked={includeMatching}
                  onChange={setIncludeMatching}
                  className={`${
                    includeMatching ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      includeMatching ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Run
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (currentPage === 'instructions') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Sticky Brightspace Header */}
        <div className="sticky top-0 z-50 bg-white">
          <div className="sticky top-0 z-50 w-full bg-white">
            <img
              src="/mylsbanner.png"
              alt="Brightspace Header"
              className="w-full h-auto object-contain block"
            />
          </div>
        </div>
    
        {/* Scrollable Content BELOW the sticky header */}
        <div className="flex-1 overflow-y-auto p-8 font-lato text-[#202122] pl-[100px] pr-8">
          <h1 className="text-[40px] font-normal leading-[3.5rem] mb-14 break-words">
            Summary - {quizTitle}
          </h1>
          {/* SUBHEADINGS */}
           {/*
          <h2 className="text-[30px] font-normal mb-6">Description</h2>
          <div className="font-lato text-[20px] leading-[1.7rem] tracking-[.01rem] space-y-4 mb-12">

            <p className="font-bold">BU247 Final Exam Instructions:</p>
            <ol className="list-decimal pl-4 space-y-4">
              <li>You may use a non-programmable calculator and the scrap paper provided in the exam room. No other materials are allowed to be used during the exam.</li>
              <li>No communication with anyone (except the proctors and instructors present) is allowed during the exam.</li>
              <li>You have 2 hours to write the exam from the moment you enter the quiz.</li>
              <li>
                There are <span className="font-bold">45 questions</span> in total. The questions are a mix of multiple choice questions, true/false questions, and numerical input questions.
              </li>
              <li>
                Please <span className="font-bold">read carefully the instructions on how to answer the numerical input questions!</span> No mark will be given for incorrectly typing in a correct answer.
              </li>
              <li>You CAN move between pages. Each page will have a maximum of 5 questions.</li>
              <li>Once you have finished the exam, you must show a proctor or instructor that the exam was submitted successfully before leaving the exam room.</li>
            </ol>
           
          </div>
           */}
          {/* QUIZ DETAILS */}
          <h2 className="text-[30px] font-normal mt-14 mb-4">Quiz Details</h2>
          <div className="space-y-4 text-[1.2rem] leading-[1.4rem] tracking-[.01rem]">
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Current Time</h3>
              <p>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Current User</h3>
              <p>{userName} (username: {userName.toLowerCase().replace(' ', '')})</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Time Limit</h3>
              <p>{timeLimit} minutes</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Availability</h3>
              <p>
                Available on {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric'
                })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} until{" "}
                {new Date(Date.now() + parseInt(timeLimit) * 60000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric'
                })} {new Date(Date.now() + parseInt(timeLimit) * 60000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Attempts</h3>
              <p>Allowed - 1, Completed - 0</p>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <h2 className="text-[30px] font-normal mt-10 mb-8">Instructions</h2>
          <p className="text-[1.20rem] leading-[1.4rem] tracking-[.01rem] mb-8">
            When the timer reaches zero, your answers will be automatically saved and submitted.
          </p>
          <p className="text-[1.20rem] leading-[1.4rem] tracking-[.01rem] mb-8">
            Click "Start Quiz" to begin Attempt 1.
          </p>

          {/* QUIZ REQUIREMENTS */}
          <h2 className="text-[30px] font-normal mb-2">Quiz Requirements</h2>
          <p className="text-[16x] font-semibold text-gray-600 mt-6 mb-4">A password is required to start your attempt.</p>
          <div className="flex items-center gap-4 mb-4">
            <label htmlFor="quizPassword" className="font-semibold text-[.95rem]">Quiz password:</label>
            <input
              type="text"
              id="quizPassword"
              value={quizPassword}
              onChange={(e) => setQuizPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            onClick={handleBeginQuiz}
            disabled={requirePassword && !quizPassword}
            className={`mt-2 px-5 py-2 rounded-md font-medium text-white ${
              (!requirePassword || quizPassword)
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-300 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            Start Quiz!
          </button>
        </div>



{/*
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Quiz Period Not Started</h2>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Description</h3>
            </div>

            <div className="space-y-4">
              <p className="font-medium text-gray-800">{quizTopic} Final Exam Instructions:</p>
              
              <ol className="list-decimal pl-6 space-y-4">
                <li className="text-gray-700">
                  You may use a non-programmable calculator and the scrap paper provided in the exam room. No other materials are allowed to be used during the exam.
                </li>
                <li className="text-gray-700">
                  No communication with anyone (except the proctors and instructors present) is allowed during the exam.
                </li>
                <li className="text-gray-700">
                  You have {timeLimit} minutes to write the exam from the moment you enter the quiz.
                </li>
                <li className="text-gray-700">
                  There are {totalQuestions} questions in total. The questions are a mix of {[
                    includeMultipleChoice && 'multiple choice',
                    includeWrittenAnswers && 'written answer',
                    includeMatching && 'matching'
                  ].filter(Boolean).join(', ')} questions.
                </li>
                <li className="text-gray-700">
                  Please read carefully the instructions on how to answer the questions! No mark will be given for incorrectly formatted answers.
                </li>
                <li className="text-gray-700">
                  You can move between pages. Each page will have a maximum of 5 questions.
                </li>
              </ol>
            </div>
          </div>

*/}              





    </div>
    );
  }

  return (
    <div
    className="min-h-screen flex flex-col bg-white overflow-x-hidden"
    style={currentPage === 'quiz' ? { overflowY: 'scroll', scrollbarWidth: 'none' } : {}}
  >
{/* 🧠 Fully Sticky Top: Brightspace Header + Title + Timer */}
<div className="sticky top-0 z-50 bg-white shadow-sm">
  <img 
    src="/mylsbanner.png" 
    alt="Brightspace Header" 
    className="w-full"
    style={{ objectFit: 'cover' }}
  />
  <div className="pl-[100px] pr-6 py-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-700 truncate max-w-[calc(100%-320px)]">
        {quizTitle}
      </h1>
      <div className="flex items-center gap-3 mr-[100px]">
        <svg width="18" height="18" viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="16" stroke="#E5E7EB" strokeWidth="6" fill="none" />
          <circle cx="18" cy="18" r="16" stroke="#3B82F6" strokeWidth="6" fill="none"
            strokeDasharray="100"
            strokeDashoffset={100 - (timeLeft / (parseInt(timeLimit) * 60)) * 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-l tabular-nums text-gray-800 whitespace-nowrap">
          {new Date(timeLeft * 1000).toISOString().substr(11, 8)} <span className="ml-1">remaining</span>
        </div>
      </div>
    </div>
  </div>
</div>

  
      {/* Main layout */}
      <div className="flex pl-[100px] pr-[30px]">
        <div className="w-[235px]" />
        {/* Fixed Sidebar */}
        <div className="fixed top-[154px] left-[100px] w-[185px] h-[calc(100vh-134px)] overflow-y-auto border-r bg-white pr-3 hide-scrollbar">

          <div className="overflow-y-auto text-sm space-y-6">
            {Array.from({ length: parseInt(numberOfPages) }).map((_, pageIndex) => {
              const startIdx = pageIndex * parseInt(questionsPerPage);
              const endIdx = startIdx + parseInt(questionsPerPage);
              const pageQuestions = questions.slice(startIdx, endIdx);
              return (
                <div key={pageIndex}>
                  <div className="font-bold mb-2 text-[1rem]">Page {pageIndex + 1}:</div>
                  <div className="grid grid-cols-3  gap-y-[12px] mb-4">

                    {pageQuestions.map((question) => {
                      const isAnswered = answeredQuestions.has(question.id);
                      return (
                        <button
                          key={question.id}
                          onClick={() => scrollToQuestion(question.id)}
                          className="w-[40px] h-[64px] text-sm border border-gray-300 rounded-md flex flex-col justify-center items-center hover:bg-gray-100 transition"
                        >
                          <span className="text-[#006FBF] font-medium">{question.id}</span>
                          <span className="status">
                            {isAnswered ? <Check className="w-4 h-4 text-gray-500" /> : '--'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
  
        {/* Main Question Content */}
        <div
          ref={quizContentRef}
          className="flex-1 py-6 pr-[140px] relative hide-scrollbar overflow-y-auto h-[calc(100vh-184px)] scroll-auto"
        >
          {questions
            .slice(
              (currentQuizPage - 1) * parseInt(questionsPerPage),
              currentQuizPage * parseInt(questionsPerPage)
            )
            .map((question, index) => {
              const absoluteIndex = (currentQuizPage - 1) * parseInt(questionsPerPage) + index;
              return (
                <div
                  key={question.id}
                  ref={(el) => (questionRefs.current[absoluteIndex] = el)}
                  className="mt-8 mb-12"
                  >
                  <h2 className="text-xl font-semibold mb-3">
                    <span className="mr-2">Question {question.id}</span>
                    <span className="text-gray-600 font-normal">
                      ({question.points} point{question.points > 1 ? 's' : ''})
                    </span>
                  </h2>
                  <p className="text-[1.25rem] leading-7 mb-6 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: question.text }} />
                  {renderQuestion(question)}
                </div>
              );
            })}
  
          {/* Bottom Controls */}
          <div className="mt-8 mb-8 flex items-center pl-[8px] space-x-4">
            <button
              onClick={() => setCurrentQuizPage(prev => Math.max(1, prev - 1))}
              disabled={currentQuizPage === 1}
              className="px-6 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Previous Page
            </button>
            <button
              onClick={() => setCurrentQuizPage(prev => Math.min(parseInt(numberOfPages), prev + 1))}
              disabled={currentQuizPage === parseInt(numberOfPages)}
              className="px-6 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Next Page
            </button>


            <button
              onClick={() => {
                window.close();
              }}
              className="ml-auto px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Quiz
            </button>
            <span className="text-gray-600 ml-4">
              {answeredQuestions.size} of {questions.length} questions saved
            </span>
          </div>
        </div>
      </div>
  
      {/* ✅ CUSTOM SCROLLBAR goes OUTSIDE of content layout */}
      <div className="fixed top-[184px] right-[120px] w-[8px] h-[calc(100vh-184px)] z-50">
        <div
          style={{
            height: `${(quizContentRef.current?.clientHeight || 1) / (quizContentRef.current?.scrollHeight || 1) * 100}%`,
            top: `${(scrollTop / (quizContentRef.current?.scrollHeight || 1)) * 100}%`,
            position: 'absolute',
            left: 0,
            right: 0,
          }}
          className="bg-gray-400 rounded-full w-full transition-all"
        />
      </div>
  
      {/* Chat box */}
      <div
        className={`fixed bottom-4 right-4 transition-opacity duration-300 ${isChatVisible ? 'opacity-100' : 'opacity-0'}`}
        onMouseEnter={() => setIsChatVisible(true)}
        onMouseLeave={() => setIsChatVisible(false)}
      >
        <form onSubmit={handleSendMessage} className="bg-white/70 backdrop-blur-md rounded-lg shadow-lg p-4 w-64">
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="w-full h-24 p-2 border border-gray-300 rounded-md mb-2 resize-none"
            placeholder="Type your message..."
          />
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              disabled={cooldownTime > 0}
              className={`flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${cooldownTime > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Send className="w-4 h-4 mr-2" />
              {cooldownTime > 0 ? `Wait ${cooldownTime}s` : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;