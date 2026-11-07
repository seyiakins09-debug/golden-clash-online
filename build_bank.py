import json, random
random.seed(20261107)
cats=[('Golden Intelligence',500),('Golden Puzzle',1000),('Golden Memory',1500),('Golden Strategy',2000),('Golden Jackpot',3000),('Golden Mystery',1000),('Golden Wordplay',1500),('Golden Survival',2000),('Golden Risk',2500),('Golden Final Showdown',5000)]
bank=[]
for s in range(1,31):
  for r in range(1,11):
    idx=(s+r-2)%10; cat,xp=cats[idx]
    seed=s*100+r
    typ=(s+r)%10
    if typ==0:
      a=seed%97+13; b=(seed*3)%41+9; c=(seed*7)%19+2
      q=f"Calculate: ({a} × {b}) − ({c} × 4). Give the exact number."
      ans=str(a*b-c*4)
    elif typ==1:
      a=seed%8+3; start=seed%20+4; diff=seed%9+2
      seq=[start+i*diff for i in range(a)]
      q=f"Complete the sequence: {', '.join(map(str,seq))}, __. What is the next number?"
      ans=str(start+a*diff)
    elif typ==2:
      n=seed%7+4; vals=[(seed+i*5)%20+1 for i in range(n)]
      q=f"Memory challenge: memorize these numbers: {', '.join(map(str,vals))}. What is their sum?"
      ans=str(sum(vals))
    elif typ==3:
      a=seed%19+11; b=seed%13+5; total=a+b
      q=f"A team has {total} tokens. Team A has {a} more tokens than Team B. How many tokens does Team B have?"
      ans=str(b)
    elif typ==4:
      a=seed%12+3; b=seed%10+2
      q=f"Jackpot calculation: A vault has {a} rows with {b} gold bars in each row. {seed%7+1} bars are removed. How many remain?"
      ans=str(a*b-(seed%7+1))
    elif typ==5:
      a=seed%9+2; b=seed%6+2
      q=f"Mystery: I am a number. Multiply me by {a}, then subtract {b*a}; the result is {a*(seed%15+1)-b*a}. What number am I?"
      ans=str(seed%15+1-b)
    elif typ==6:
      words=['TRIANGLE','CHAMPION','STRATEGY','KINGDOM','VICTORY','GOLDEN','MYSTERY','BATTLE','CROWN','LEGEND']
      w=words[(s+r)%len(words)]
      q=f"Wordplay: How many letters are in the word '{w}'?"
      ans=str(len(w))
    elif typ==7:
      a=seed%30+20; b=seed%15+5; c=seed%9+1
      q=f"Survival ration puzzle: {a} supplies are shared equally among {b} players. How many supplies are left over?"
      ans=str(a%b)
    elif typ==8:
      a=seed%8+2; b=seed%12+3
      q=f"Risk decision: You have {a} points. A risky move doubles your points but costs {b} points as a fee. What is your final score if you take the risk?"
      ans=str(a*2-b)
    else:
      a=seed%17+7; b=seed%13+4; c=seed%9+2
      q=f"Final showdown: Solve for x: {a}x + {b} = {a*c+b}."
      ans=str(c)
    bank.append({'set':s,'round':r,'category':cat,'xp':xp,'question':q,'answer':ans,'acceptedAnswers':[ans], 'difficulty':'Very Challenging'})
with open('/mnt/data/SEY_GAMERZ_GOLDEN_ARENA_COMPLETE/data/questions.json','w') as f: json.dump(bank,f,indent=2)
print('Created',len(bank),'rounds')
