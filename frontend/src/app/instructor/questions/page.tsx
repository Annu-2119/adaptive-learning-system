"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function QuestionsPage() {

  const [quizSets,setQuizSets] = useState<any[]>([]);
  const [questions,setQuestions] = useState<any[]>([]);
  const [selected,setSelected] = useState<number|null>(null);

  const [modal,setModal] = useState(false);
  const [editId,setEditId] = useState<number|null>(null);

  const emptyForm = {
    quiz_set_id:"",
    question_text:"",
    question_type:"mcq",
    correct_answer:"",
    marks:1,
    topic:""
  };

  const [form,setForm] = useState(emptyForm);


  useEffect(()=>{
    loadQuizSets();
  },[]);

  const loadQuizSets = async()=>{
    try{
      const res = await axios.get(`${API}/quizzes`);
      setQuizSets(res.data);
    }catch(err){
      console.log(err);
    }
  };

  const loadQuestions = async(id:number)=>{

    setSelected(id);

    try{

      const res = await axios.get(
        `${API}/questions/quizset/${id}`
      );

      setQuestions(res.data);

      setForm({
        ...emptyForm,
        quiz_set_id:String(id)
      });

    }catch(err){
      console.log(err);
    }

  };

  const saveQuestion = async()=>{

    if(!selected) return;

    try{

      if(editId){

        await axios.put(
          `${API}/questions/${editId}`,
          form
        );

      }else{

        await axios.post(
          `${API}/questions`,
          form
        );

      }

      setModal(false);
      setEditId(null);

      loadQuestions(selected);

    }catch(err){
      console.log(err);
    }

  };

  const editQuestion=(q:any)=>{

    setEditId(q.id);

    setForm({
      quiz_set_id:String(q.quiz_set_id),
      question_text:q.question_text,
      question_type:q.question_type,
      correct_answer:q.correct_answer,
      marks:q.marks,
      topic:q.topic
    });

    setModal(true);

  };


  const deleteQuestion=async(id:number)=>{

    if(!confirm("Delete this question?")) return;

    await axios.delete(
      `${API}/questions/${id}`
    );

    if(selected)
      loadQuestions(selected);

  };

  return (

<div className="min-h-screen bg-slate-900 p-8">

<h1 className="text-4xl font-bold text-white mb-6">
 Questions Management
</h1>

<div className= "bg-gradient-to-r from-indigo-700 via-blue-700 to-purple-700 rounded-2xl shadow-xl p-6 mb-8 flex flex-wrap gap-4 items-center">

<select
className="
bg-slate-700
border
border-slate-600
text-white
rounded-xl
px-4
py-3
outline-none
focus:ring-2
focus:ring-blue-500
"

onChange={(e)=>loadQuestions(Number(e.target.value))}
>

<option>
Select Quiz Set
</option>

{
quizSets.map(q=>
<option key={q.id} value={q.id}>
{q.title}
</option>
)
}

</select>

<button

disabled={!selected}

onClick={()=>setModal(true)}

className="
bg-emerald-600 hover:bg-emerald-700
text-white
px-5
py-2
rounded-xl
disabled:bg-gray-800
"

>
+ Add Question
</button>

</div>

<div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">


<table className="w-full">


<thead className="bg-indigo-700 text-white">

<tr>

<th className="p-3 text-left">
Question
</th>

<th>
Type
</th>

<th>
Marks
</th>

<th>
Topic
</th>

<th>
Action
</th>

</tr>

</thead>

<tbody>


{
questions.map(q=>(

<tr
key={q.id}
className="border-b border-slate-700 hover:bg-slate-700 text-white transition"
>

<td className="p-3">
{q.question_text}
</td>

<td>
{q.question_type}
</td>

<td>
{q.marks}
</td>

<td>
{q.topic}
</td>

<td className="space-x-2">
<button

onClick={()=>editQuestion(q)}

className="
bg-amber-500 hover:bg-amber-600
text-white
px-3
py-1
rounded
"

>
Edit
</button>

<button

onClick={()=>deleteQuestion(q.id)}

className="
bg-red-600
text-white
px-3
py-1
rounded
"

>
Delete
</button>

</td>

</tr>

))
}

</tbody>
</table>
</div>

{
modal && (

<div
className="
fixed inset-0
bg-black/50
flex
items-center
justify-center
"
>

<div
className="
bg-slate-800 text-white
rounded-2xl
p-6
w-[450px]
shadow-xl
"
>

<h2 className="text-xl font-bold mb-4">

{editId ? "Edit Question":"Add Question"}

</h2>

<textarea

className="input"

placeholder="Question"

value={form.question_text}

onChange={
e=>setForm({
...form,
question_text:e.target.value
})
}

/>

<select

className="
w-full
mb-3
bg-slate-700
border
border-slate-600
text-white
rounded-xl
p-3
focus:ring-2
focus:ring-blue-500
outline-none
"

value={form.question_type}

onChange={
e=>setForm({
...form,
question_type:e.target.value
})
}

>

<option value="mcq">
MCQ
</option>

<option value="subjective">
Subjective
</option>

</select>

<input

className="input"

placeholder="Correct Answer"

value={form.correct_answer}

onChange={
e=>setForm({
...form,
correct_answer:e.target.value
})
}

/>

<input

className="input"

type="number"

value={form.marks}

onChange={
e=>setForm({
...form,
marks:Number(e.target.value)
})
}

/>

<input

className="input"

placeholder="Topic"

value={form.topic}

onChange={
e=>setForm({
...form,
topic:e.target.value
})
}

/>

<div className="flex justify-end gap-3 mt-5">
<button

onClick={()=>setModal(false)}

className="
bg-slate-600 hover:bg-slate-700
text-white
px-4
py-2
rounded-xl
"

>
Cancel
</button>

<button

onClick={saveQuestion}

className="
bg-blue-600 hover:bg-blue-700
text-white
px-4
py-2
rounded-xl
"

>
Save
</button>

</div>
</div>
</div>
)
}
</div>
  );
}